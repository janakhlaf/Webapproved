from db import get_connection


def create_chat_session(user_id: int):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO chat_sessions (user_id)
        VALUES (%s)
        RETURNING id, title, created_at
    """, (user_id,))

    session = cur.fetchone()

    conn.commit()

    cur.close()
    conn.close()

    return {
        "id": session[0],
        "title": session[1],
        "created_at": str(session[2])
    }


def get_user_sessions(user_id: int):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, title, updated_at
        FROM chat_sessions
        WHERE user_id = %s
        ORDER BY updated_at DESC
    """, (user_id,))

    rows = cur.fetchall()

    cur.close()
    conn.close()

    sessions = []

    for row in rows:
        sessions.append({
            "id": row[0],
            "title": row[1],
            "updated_at": str(row[2])
        })

    return sessions


def save_chat_message(
    session_id: int,
    user_id: int,
    role: str,
    content: str
):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO chat_messages
        (session_id, user_id, role, content)
        VALUES (%s, %s, %s, %s)
    """, (
        session_id,
        user_id,
        role,
        content
    ))

    if role == "user":
        title = content[:35]

        cur.execute("""
            UPDATE chat_sessions
            SET title = CASE
                WHEN title = 'New Chat' THEN %s
                ELSE title
            END,
            updated_at = NOW()
            WHERE id = %s
        """, (title, session_id))
    else:
        cur.execute("""
            UPDATE chat_sessions
            SET updated_at = NOW()
            WHERE id = %s
        """, (session_id,))

    conn.commit()

    cur.close()
    conn.close()


def get_session_messages(session_id: int):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, role, content, created_at
        FROM chat_messages
        WHERE session_id = %s
        ORDER BY created_at ASC
    """, (session_id,))

    rows = cur.fetchall()

    cur.close()
    conn.close()

    messages = []

    for row in rows:
        messages.append({
            "id": row[0],
            "role": row[1],
            "content": row[2],
            "created_at": str(row[3])
        })

    return messages
def delete_chat_session(session_id: int, user_id: int):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        DELETE FROM chat_sessions
        WHERE id = %s AND user_id = %s
    """, (session_id, user_id))

    conn.commit()

    cur.close()
    conn.close()

    return True