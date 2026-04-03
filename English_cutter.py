import re

def get_lc_cutter(name):
    """
    ฟังก์ชันสำหรับคำนวณ LC Cutter (Library of Congress Cutter Table)
    ข้ามคำนำหน้า (Articles): A, An, The 
    และจำกัดผลลัพธ์เป็น อักษร 1 ตัว + ตัวเลขสูงสุด 3 หลัก
    อ้างอิงข้อมูลตารางจาก: https://www.loc.gov/aba/pcc/053/table.html
    """
    if not name:
        return ""
    
    # 1. ตัดคำนำหน้า A, An, The (แบบไม่สนตัวพิมพ์เล็ก/ใหญ่) และทำเป็นตัวพิมพ์ใหญ่
    name = re.sub(r'^(A|AN|THE)\s+', '', name, flags=re.IGNORECASE).strip().upper()
    
    if not name:
        return ""
        
    cutter = name[0]
    remaining = name[1:].lower()
    
    def get_number_vowel(c):
        if c < 'd': return '2'
        if c < 'l': return '3'
        if c < 'n': return '4'
        if c < 'p': return '5'
        if c < 'r': return '6'
        if c < 's': return '7'
        if c < 'u': return '8'
        return '9'

    def get_number_s(c):
        if c < 'c': return '2'
        if c < 'e': return '3'
        if c < 'h': return '4'
        if c < 'm': return '5'
        if c < 't': return '6'
        if c < 'u': return '7'
        if c < 'w': return '8'
        return '9'

    def get_number_qu(c):
        if c < 'e': return '3'
        if c < 'i': return '4'
        if c < 'o': return '5'
        if c < 'r': return '6'
        if c < 't': return '7'
        if c < 'y': return '8'
        return '9'

    def get_number_consonant(c):
        if c < 'e': return '3'
        if c < 'i': return '4'
        if c < 'o': return '5'
        if c < 'r': return '6'
        if c < 'u': return '7'
        if c < 'y': return '8'
        return '9'

    def get_expansion(c):
        if c < 'e': return '3'
        if c < 'i': return '4'
        if c < 'm': return '5'
        if c < 'p': return '6'
        if c < 't': return '7'
        if c < 'w': return '8'
        return '9'

    # 2. ตรวจสอบเงื่อนไขตามอักษรเริ่มต้น
    if cutter in 'AEIOU':
        c = remaining[0] if len(remaining) > 0 else ''
        cutter += get_number_vowel(c)
        remaining = remaining[1:]
    elif cutter == 'S':
        c = remaining[0] if len(remaining) > 0 else ''
        cutter += get_number_s(c)
        remaining = remaining[1:]
    elif cutter == 'Q':
        c = remaining[0] if len(remaining) > 0 else ''
        if c == 'u':
            c2 = remaining[1] if len(remaining) > 1 else ''
            cutter += get_number_qu(c2)
            remaining = remaining[2:]
        else:
            cutter += '2'
            remaining = remaining[1:]
    else:
        c = remaining[0] if len(remaining) > 0 else ''
        cutter += get_number_consonant(c)
        remaining = remaining[1:]
        
    # 3. แปลงส่วนที่เหลือเป็น Expansion Number
    for ch in remaining:
        if ch.isalpha():
            cutter += get_expansion(ch)
            
    # 4. จำกัดตัวเลขผลลัพธ์ (อักษร 1 ตัว และเลขไม่เกิน 3 ตัว -> รวมตัดที่ 4 หลัก)
    return cutter[:4]

# ตัวอย่างการใช้งาน
if __name__ == "__main__":
    names_to_test =[
        "The United States", 
        "A Boy", 
        "An Apple", 
        "Smith", 
        "Queen", 
        "Juarez"
    ]
    
    print("--- LC Cutter Table Test (Skipping Articles & Max 3 Digits) ---")
    for n in names_to_test:
        print(f"Original: {n:<20} | LC Cutter: {get_lc_cutter(n)}")