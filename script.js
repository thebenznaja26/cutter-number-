document.addEventListener('DOMContentLoaded', () => {
    const authorInput = document.getElementById('authorInput');
    const resultDisplay = document.getElementById('result');

    let cutterData = {};
    const initialMessage = '- รอการค้นหา -';
    const notFoundMessage = 'ไม่พบข้อมูล';
    const errorMessage = 'เกิดข้อผิดพลาดในการโหลดข้อมูล';

    // 1. ฟังก์ชันสำหรับโหลดข้อมูลจากไฟล์ JSON
    async function loadCutterData() {
        try {
            const response = await fetch('cutter_data.json');
            if (!response.ok) {
                // หากไม่สามารถโหลดไฟล์ได้ (เช่น 404 Not Found)
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            cutterData = await response.json();
            // เมื่อโหลดข้อมูลสำเร็จ, สามารถเริ่มค้นหาได้
            authorInput.disabled = false;
            authorInput.placeholder = "เช่น นิภา, มงคล, สุชาติ...";
        } catch (error) {
            console.error("Could not load cutter data:", error);
            // แสดงข้อความผิดพลาดบนหน้าจอ
            resultDisplay.textContent = errorMessage;
            resultDisplay.style.color = '#e74c3c'; // สีแดง
            // ปิดการใช้งาน input field หากโหลดข้อมูลไม่ได้
            authorInput.disabled = true;
            authorInput.placeholder = "ไม่สามารถโหลดฐานข้อมูลได้";
        }
    }

    // 2. ฟังก์ชันสำหรับค้นหาเลขคัตเตอร์
    function findCutterNumber(query) {
        // ถ้าไม่มีการพิมพ์ (ค่าว่าง) ให้กลับไปเป็นสถานะเริ่มต้น
        if (!query) {
            return initialMessage;
        }

        // ตัดช่องว่างที่ไม่จำเป็นออกจากคำค้นหา
        const normalizedQuery = query.trim();

        // วนลูปเพื่อค้นหาในข้อมูลที่โหลดมา
        for (const key in cutterData) {
            // บาง key อาจมีหลายชื่อ คั่นด้วย comma เช่น "นิมิต, นิมิตร"
            // เราจะแยกชื่อเหล่านั้นออกมาเป็น array
            const names = key.split(',').map(name => name.trim());

            // ตรวจสอบว่ามีชื่อใดใน array ที่ "ขึ้นต้นด้วย" คำค้นหาหรือไม่
            // ทำให้การค้นหาแบบ "นิภา" สามารถเจอ "นิภาวรรณ" ได้
            const isMatch = names.some(name => name.startsWith(normalizedQuery));

            if (isMatch) {
                // ถ้าเจอ ให้คืนค่าเลขคัตเตอร์ทันที
                return cutterData[key];
            }
        }

        // ถ้าวนลูปจนจบแล้วไม่เจอ ให้คืนค่าว่า "ไม่พบข้อมูล"
        return notFoundMessage;
    }

    // 3. เพิ่ม Event Listener ให้กับช่องค้นหา
    authorInput.addEventListener('input', () => {
        const query = authorInput.value;
        const result = findCutterNumber(query);

        // อัปเดตข้อความที่แสดงผล
        resultDisplay.textContent = result;

        // เปลี่ยนสีข้อความตามสถานะเพื่อประสบการณ์ใช้งานที่ดีขึ้น
        if (result === notFoundMessage) {
            resultDisplay.style.color = '#e74c3c'; // สีแดงสำหรับ "ไม่พบ"
        } else if (result === initialMessage) {
            resultDisplay.style.color = '#333'; // สีเทาสำหรับสถานะเริ่มต้น
        } else {
            resultDisplay.style.color = 'var(--secondary-color)'; // สีหลักสำหรับผลลัพธ์ที่ถูกต้อง
        }
    });

    // 4. เริ่มโหลดข้อมูลทันทีเมื่อหน้าเว็บพร้อมใช้งาน
    loadCutterData();
});