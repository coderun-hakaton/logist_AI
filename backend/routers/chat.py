import os
import json
from datetime import datetime, timezone

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

router = APIRouter()

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "karvonboshi")

_mongo = AsyncIOMotorClient(MONGO_URL)
messages_col = _mongo[DB_NAME]["chat_messages"]

MODEL = "openai"
MODEL_NAME = "gpt-5.4"

SYSTEM_PROMPT = """Siz "Karvonboshi" — O'zbekistondagi yuk tashish va logistika platformasining AI yordamchisisiz.
Sizning vazifangiz: marshrutlar, xarajatlar, dam olish maskanlari va logistika bo'yicha aniq, foydali javoblar berish.

Faktlar (javoblaringizda shularga tayaning):
- O'zbekiston shaharlari: Toshkent (Toshkent), Samarqand, Buxoro, Andijon, Namangan, Nukus, Farg'ona, Qarshi, Qo'qon, Termiz, Urganch, Navoiy, Jizzax, Guliston, Chirchiq, Angren, Marg'ilon.
- Asosiy magistrallar: M-39 (Toshkent—Samarqand), M-37 (Samarqand—Buxoro), A-380 (Buxoro—Nukus), A-373 (Toshkent—Andijon, Qamchiq dovoni), M-34, M-41 (Samarqand—Termiz).
- Yoqilg'i narxi: ~18 500 so'm/litr (dizel). Haydovchi maoshi: ~50 000 so'm/soat.
- Xarajat formulasini taxminiy hisoblash: masofa (km) / 100 * sarf (litr/100km, yuk mashinasi ~30, furgon ~15, refrijerator ~35) * 18 500 + vaqt * 50 000.
- Dam olish maskanlari: Toshkent Truck Stop Complex, Samarqand Route Hotel, Buxoro Oasis Rest Stop, Navoiy Highway Diner, Qarshi Truck Plaza, Urganch Crossroads Hotel, Farg'ona Valley Stop, Qo'qon Valley Inn, Termiz Border Stop, Guliston Highway Rest, Jizzax Roadside Diner, Chirchiq Industrial Stop.
- Xavfli hududlar: Guliston chorrahasi, Angren dovani, Samarqand aylanma yo'li, Jizzax chorrahasi, Andijon yondashuvi.
- Karvonboshi marshrutlarni 7 faktor bo'yicha baholaydi: xavfsizlik, yo'l sifati, tezlik, xarajat, qulaylik, ishonchlilik, ovqat va dam olish (har biri 0-10 ball).

Qoidalar:
- Har doim O'zbek tilida (lotin yozuvi), qisqa va tushunarli javob bering.
- Raqamlarni chiziq bilan ajratib yozing: 1 250 000 so'm.
- Agar savol logistikaga aloqador bo'lmasa, muloyimlik bilan mavzuga qaytaring."""


class ChatRequest(BaseModel):
    session_id: str
    message: str


@router.post("/chat")
async def chat(req: ChatRequest):
    if not EMERGENT_LLM_KEY:
        yield_err = StreamingResponse(
            iter([f"data: {json.dumps({'error': 'EMERGENT_LLM_KEY sozlanmagan'}, ensure_ascii=False)}\n\ndata: [DONE]\n\n"]),
            media_type="text/event-stream",
        )
        return yield_err

    history = await messages_col.find({"session_id": req.session_id}).sort("ts", 1).to_list(50)
    await messages_col.insert_one({
        "session_id": req.session_id,
        "role": "user",
        "content": req.message,
        "ts": datetime.now(timezone.utc),
    })

    transcript = "\n".join(
        f"{'Foydalanuvchi' if m['role'] == 'user' else 'Yordamchi'}: {m['content']}"
        for m in history[-10:]
    )
    prompt = f"{transcript}\nFoydalanuvchi: {req.message}\nYordamchi:" if transcript else req.message

    chat_client = (
        LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=req.session_id,
            system_message=SYSTEM_PROMPT,
        )
        .with_model(MODEL, MODEL_NAME)
    )

    async def event_generator():
        full_reply = []
        try:
            async for event in chat_client.stream_message(UserMessage(text=prompt)):
                if isinstance(event, TextDelta):
                    full_reply.append(event.content)
                    yield f"data: {json.dumps({'delta': event.content}, ensure_ascii=False)}\n\n"
                elif isinstance(event, StreamDone):
                    break
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"
        finally:
            if full_reply:
                await messages_col.insert_one({
                    "session_id": req.session_id,
                    "role": "assistant",
                    "content": "".join(full_reply),
                    "ts": datetime.now(timezone.utc),
                })
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
