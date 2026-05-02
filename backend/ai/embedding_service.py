import os
from dotenv import load_dotenv
from openai import OpenAI

# تحميل متغيرات .env
load_dotenv()

# إنشاء العميل
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

EMBEDDING_MODEL = "text-embedding-3-small"


# تحويل النص إلى embedding
def create_embedding(text: str):
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text
    )
    return response.data[0].embedding


# تحويله لصيغة PostgreSQL vector
def embedding_to_pgvector(embedding):
    return "[" + ",".join(str(x) for x in embedding) + "]"


# تجهيز نص الفيلم
def build_film_embedding_text(title, description, category):
    return f"""
Title: {title}
Category: {category}
Description: {description}
""".strip()


# تجهيز نص الأسيت
def build_asset_embedding_text(name, description, category, file_type):
    return f"""
Asset Name: {name}
Category: {category}
File Type: {file_type}
Description: {description}
""".strip()