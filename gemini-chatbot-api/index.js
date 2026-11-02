import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
const MAX_HISTORY = 20;
const MAX_MESSAGE_LENGTH = 4000;
const CHAT_RATE_LIMIT = 10;
const CHAT_RATE_LIMIT_WINDOW_MS = 60 * 1000;

const app = express();
app.use(cors({
    origin: (origin, callback) => callback(null, Boolean(CLIENT_ORIGIN && origin === CLIENT_ORIGIN))
}));
app.use(express.json());
app.use(express.static(fileURLToPath(new URL('./public', import.meta.url))));

const chatRequestsByIp = new Map();
const rateLimitCleanup = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of chatRequestsByIp) {
        if (entry.resetAt <= now) chatRequestsByIp.delete(ip);
    }
}, CHAT_RATE_LIMIT_WINDOW_MS);
rateLimitCleanup.unref();

function limitChatRequests(req, res, next) {
    const now = Date.now();
    let entry = chatRequestsByIp.get(req.ip);
    if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + CHAT_RATE_LIMIT_WINDOW_MS };
        chatRequestsByIp.set(req.ip, entry);
    }

    if (entry.count >= CHAT_RATE_LIMIT) {
        res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
        return res.status(429).json({
            error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
            code: 'RATE_LIMITED'
        });
    }

    entry.count += 1;
    next();
}

class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

function validate(body) {
    const { conversation, location } = body;
    if (!Array.isArray(conversation) || conversation.length === 0) {
        throw new HttpError(400, 'conversation harus berupa array dan tidak boleh kosong');
    }
    const valid = conversation.every(
        (m) => ['user', 'model'].includes(m?.role) && typeof m?.text === 'string' && m.text.trim()
    );
    if (!valid) throw new HttpError(400, 'Setiap pesan butuh role (user atau model) dan text');
    if (conversation[conversation.length - 1].role !== 'user') {
        throw new HttpError(400, 'Pesan terakhir harus dari user');
    }
    if (conversation[conversation.length - 1].text.length > MAX_MESSAGE_LENGTH) {
        throw new HttpError(400, `Pesan tidak boleh lebih dari ${MAX_MESSAGE_LENGTH} karakter`);
    }
    const hasLocation = typeof location?.lat === 'number' && typeof location?.lng === 'number';
    return {
        conversation: conversation.slice(-MAX_HISTORY),
        location: hasLocation ? location : null
    };
}

app.post('/api/chat', limitChatRequests, async (req, res) => {
    try {
        const { conversation, location } = validate(req.body);

        const contents = conversation.map(({ role, text }) => ({
            role,
            parts: [{ text }]
        }));

        const today = new Date().toISOString().slice(0, 10);
        const config = {
            tools: [{
                googleMaps: location
                    ? { latitude: location.lat, longitude: location.lng }
                    : {}
            }],
            systemInstruction: `
                Kamu Gymmy, asisten olahraga pribadi yang ramah.
                Tanggal hari ini ${today}.
                Selalu jawab dalam bahasa Indonesia dengan ringkas dan membantu.
                Kamu membantu pengguna menemukan dan membandingkan gym atau fasilitas olahraga di seluruh dunia; gunakan Google Maps untuk mencari rekomendasi nyata berdasarkan nama tempat atau area yang diminta.
                Gunakan Google Maps untuk informasi aktual seperti alamat, rating, jam buka, dan rute. Jangan mengarang tempat, rating, jam buka, harga, jarak, atau detail lain. Jika lokasi pencarian belum cukup jelas dan koordinat tidak tersedia, tanyakan area/kota kepada pengguna.
                Sertakan tautan sumber Google Maps untuk setiap tempat yang direkomendasikan.
                Kamu juga dapat membuat jadwal workout atau rencana kunjungan pribadi yang terstruktur sesuai tujuan, tingkat kebugaran, dan ketersediaan pengguna. Jadwal atau rencana tersebut hanya saran pribadi, bukan booking/reservasi resmi; jangan pernah mengklaim telah membuat reservasi.
                Jika informasi untuk menyusun jadwal belum cukup, tanyakan detail yang diperlukan.`
        };

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config
        });
        const mapsSources = new Map();
        const groundingChunks = response.candidates?.flatMap(
            (candidate) => candidate.groundingMetadata?.groundingChunks ?? []
        ) ?? [];
        for (const chunk of groundingChunks) {
            if (chunk.maps?.uri) {
                mapsSources.set(chunk.maps.uri, {
                    title: chunk.maps.title || chunk.maps.text || 'Google Maps',
                    url: chunk.maps.uri
                });
            }
        }

        res.status(200).json({
            result: response.text ?? '',
            reply: response.text ?? '',
            sources: [...mapsSources.values()]
        });
    } catch (e) {
        const status = e.status === 400 ? 400 : e.status === 429 ? 429 : 500;
        console.error(`Chat request failed with status ${status}:`, e);
        res.status(status).json({
            error: status === 400
                ? 'Permintaan tidak valid. Periksa pesan Anda dan coba lagi.'
                : status === 429
                    ? 'Layanan AI sedang mencapai batas penggunaan. Silakan coba lagi nanti.'
                    : 'Terjadi kesalahan di server'
        });
    }
});

app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));