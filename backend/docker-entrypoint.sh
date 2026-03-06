#!/bin/sh
set -eu

echo "[backend] Checking database state..."
DB_TOTAL="$(python -c "from app.database import SessionLocal, Character, Sentence, HSKTest, Flashcard, Phrase; db=SessionLocal(); total=db.query(Character).count()+db.query(Sentence).count()+db.query(HSKTest).count()+db.query(Flashcard).count()+db.query(Phrase).count(); db.close(); print(total)" 2>/dev/null || echo "0")"

case "$DB_TOTAL" in
  ''|*[!0-9]*) DB_TOTAL=0 ;;
esac

if [ "$DB_TOTAL" -eq 0 ]; then
  echo "[backend] Database is empty. Running seed script..."
  python scripts/populate_db.py
else
  echo "[backend] Seed skipped. Existing records: $DB_TOTAL"
fi

exec "$@"
