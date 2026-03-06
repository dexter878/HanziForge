"""Fix the 2 remaining mojibake strings in main.py."""
path = r'r:\project\HanziForge\backend\app\main.py'

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

fixed = 0
new_lines = []

for i, line in enumerate(lines):
    # Line with login error - match by surrounding code context
    if 'status_code=401' in line and 'detail=' in line and 'Неверные' not in line and 'Не авторизован' not in line and 'Требуется' not in line and 'Authentication' not in line:
        new_line = '        raise HTTPException(status_code=401, detail="Неверные учётные данные")\r\n'
        new_lines.append(new_line)
        fixed += 1
        print(f"Fixed line {i+1}: login error")
        continue
    
    # Line with character not found error
    if 'status_code=404' in line and 'detail=' in line and 'Flashcard' not in line and 'Тест' not in line and 'Иероглиф' not in line:
        new_line = '        raise HTTPException(status_code=404, detail="Иероглиф не найден")\r\n'
        new_lines.append(new_line)
        fixed += 1
        print(f"Fixed line {i+1}: character not found error")
        continue
    
    new_lines.append(line)

with open(path, 'w', encoding='utf-8', newline='') as f:
    f.writelines(new_lines)

print(f"\nFixed {fixed} lines")

# Verify ALL strings
with open(path, 'r', encoding='utf-8') as f:
    verify = f.read()

for check in ['Пользователь уже существует', 'Неверные учётные данные',
              'Не авторизован', 'Требуется авторизация', 'Иероглиф не найден',
              'Тест не найден']:
    status = 'OK' if check in verify else 'MISSING'
    print(f"  {status}: '{check}'")
