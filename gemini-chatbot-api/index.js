import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const facilities = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'data', 'facilities.json'), 'utf-8')
);
const bookings = []; 

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
const MAX_HISTORY = 20;
const MAX_STEPS = 3;
const MAX_MESSAGE_LENGTH = 4000;
const CHAT_RATE_LIMIT = 10;
const CHAT_RATE_LIMIT_WINDOW_MS = 60 * 1000;

const app = express();
app.use(cors({
    origin: (origin, callback) => callback(null, Boolean(CLIENT_ORIGIN && origin === CLIENT_ORIGIN))
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

const tools = [{
    functionDeclarations: [
        {
            name: 'search_facilities',
            description: 'Cari gym atau fasilitas olahraga terdekat dari lokasi pengguna.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    facility_type: {
                        type: Type.STRING,
                        description: 'Filter fasilitas: Gym, SPA, atau Pool. Kosongkan jika tidak ada.'
                    },
                    other_options: {
                        type: Type.BOOLEAN,
                        description: 'True jika pengguna minta opsi lain selain yang sudah ditampilkan.'
                    }
                }
            }
        },
        {
            name: 'book_visit',
            description: 'Simpan booking kunjungan ke satu gym. Panggil hanya jika gym, tanggal, dan jam sudah jelas.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    facility_id: { type: Type.STRING, description: 'ID fasilitas, contoh gym-001' },
                    date: { type: Type.STRING, description: 'Tanggal format YYYY-MM-DD' },
                    time: { type: Type.STRING, description: 'Jam format HH:MM' }
                },
                required: ['facility_id', 'date', 'time']
            }
        }
    ]
}];

function distanceMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const rad = (d) => (d * Math.PI) / 180;
    const dLat = rad(lat2 - lat1);
    const dLng = rad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

function searchFacilities(args, ctx) {
    if (!ctx.location) return { error: 'LOCATION_MISSING' };
    const type = args.facility_type?.toLowerCase();
    let list = facilities
        .filter((f) => !type || f.facilities.some((x) => x.toLowerCase() === type))
        .filter((f) => !(args.other_options && ctx.shownIds.includes(f.id)))
        .map((f) => ({
            ...f,
            distance: distanceMeters(ctx.location.lat, ctx.location.lng, f.lat, f.lng)
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3);
    ctx.cards.push(...list.map((f) => ({ type: 'facility', ...f })));
    return { results: list };
}

function bookVisit(args, ctx) {
    const facility = facilities.find((f) => f.id === args.facility_id);
    if (!facility) return { error: 'FACILITY_NOT_FOUND' };
    const booking = {
        id: `bk-${Date.now()}`,
        facilityId: facility.id,
        facilityName: facility.name,
        date: args.date,
        time: args.time,
        status: 'confirmed'
    };
    bookings.push(booking);
    ctx.cards.push({ type: 'booking', ...booking });
    return { booking };
}

const handlers = { search_facilities: searchFacilities, book_visit: bookVisit };

class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

function validate(body) {
    const { conversation, location, shownIds } = body;
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
        location: hasLocation ? location : null,
        shownIds: Array.isArray(shownIds) ? shownIds : []
    };
}

app.get('/api/facilities', (req, res) => res.json(facilities));

app.get('/api/bookings', (req, res) => res.json(bookings));

app.post('/api/chat', limitChatRequests, async (req, res) => {
    try {
        const { conversation, location, shownIds } = validate(req.body);
        const ctx = { location, shownIds, cards: [] };

        const contents = conversation.map(({ role, text }) => ({
            role,
            parts: [{ text }]
        }));

        const today = new Date().toISOString().slice(0, 10);
        const config = {
            tools,
            systemInstruction: `
                Kamu Gymmy, asisten olahraga pribadi yang ramah.
                Tanggal hari ini ${today}.
                Selalu jawab dalam bahasa Indonesia dengan ringkas.
                Gunakan search_facilities untuk mencari gym. Jangan mengarang nama gym, harga, atau jarak.
                Gunakan book_visit hanya jika gym, tanggal, dan waktu sudah jelas. Jika ada yang belum jelas, tanyakan kepada pengguna.
                Jika alat mengembalikan LOCATION_MISSING, minta pengguna mengaktifkan akses lokasi.
                Kartu ditampilkan oleh aplikasi. Jangan mengulang detail kartu dalam jawaban.
                Jika pengguna meminta jadwal workout atau gym, buat jadwal latihan yang terstruktur dan sesuaikan dengan tujuan atau tingkat kebugarannya.`
        };

        let response;
        for (let step = 0; step < MAX_STEPS; step++) {
            response = await ai.models.generateContent({
                model: GEMINI_MODEL,
                contents,
                config
            });

            const calls = response.functionCalls;
            if (!calls || calls.length === 0) break;

            contents.push(response.candidates[0].content);
            contents.push({
                role: 'user',
                parts: calls.map((call) => ({
                    functionResponse: {
                        name: call.name,
                        response: handlers[call.name]
                            ? handlers[call.name](call.args ?? {}, ctx)
                            : { error: 'UNKNOWN_TOOL' }
                    }
                }))
            });
        }

        const hasFacilityCards = ctx.cards.some((c) => c.type === 'facility');
        res.status(200).json({
            result: response.text ?? '',
            reply: response.text ?? '',
            cards: ctx.cards,
            quickReplies: hasFacilityCards
                ? ['Tampilkan opsi fasilitas lainnya', 'Pesankan kunjungan ke gym']
                : []
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