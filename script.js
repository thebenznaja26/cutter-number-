document.addEventListener('DOMContentLoaded', () => {
    const authorInput = document.getElementById('authorInput');
    const resultDisplay = document.getElementById('result');

    let sortedCutterList = []; // เปลี่ยนมาใช้ Array ที่เรียงลำดับแล้ว
    const initialMessage = '- รอการค้นหา -';
    const notFoundMessage = 'ไม่พบข้อมูล';
    const errorMessage = 'เกิดข้อผิดพลาดในการโหลดข้อมูล';

    // 1. ฟังก์ชันสำหรับโหลดและเตรียมข้อมูล
    async function setupCutterData() {
        try {
            // ปิดการใช้งาน input ชั่วคราวจนกว่าข้อมูลจะพร้อม
            authorInput.disabled = true;
            authorInput.placeholder = "กำลังโหลดฐานข้อมูล...";

            const response = await fetch('cutter_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const cutterData = await response.json();

            // แปลง Object เป็น Array และเรียงลำดับตามตัวอักษรของ key
            sortedCutterList = Object.entries(cutterData).sort((a, b) => {
                // ใช้ key (ชื่อ) ในการเปรียบเทียบและเรียงลำดับ
                // เราใช้ชื่อแรกในกรณีที่มีหลายชื่อ เช่น "นิมิต, นิมิตร"
                const keyA = a[0].split(',')[0].trim();
                const keyB = b[0].split(',')[0].trim();
                return keyA.localeCompare(keyB, 'th'); // เรียงลำดับตามหลักภาษาไทย
            });
            
            // เมื่อโหลดข้อมูลสำเร็จ, เปิดให้ใช้งาน
            authorInput.disabled = false;
            authorInput.placeholder = "เช่น นิภา, มงคล, สุชาติ...";
            console.log('Cutter data loaded and sorted successfully.');

        } catch (error) {
            console.error("Could not load cutter data:", error);
            resultDisplay.textContent = errorMessage;
            resultDisplay.style.color = '#e74c3c'; // สีแดง
            authorInput.placeholder = "ไม่สามารถโหลดฐานข้อมูลได้";
        }
    }

    // 2. ฟังก์ชันสำหรับค้นหาเลขคัตเตอร์ (ปรับปรุงใหม่ทั้งหมด)
    function findCutterNumber(query) {
        if (!query) {
            return { result: initialMessage, color: '#333' };
        }

        const normalizedQuery = query.trim();
        let bestMatch = null;

        // วนลูปในรายการที่เรียงลำดับไว้แล้ว
        for (const [key, cutterNumber] of sortedCutterList) {
            // เราใช้ชื่อแรกในการเปรียบเทียบ
            const primaryName = key.split(',')[0].trim();
            
            // ถ้าคำที่ค้นหา มีค่ามากกว่าหรือเท่ากับชื่อในตาราง (ตามลำดับตัวอักษร)
            // แสดงว่าเลขคัตเตอร์นี้ยังเป็นตัวเลือกที่เป็นไปได้
            if (normalizedQuery.localeCompare(primaryName, 'th') >= 0) {
                bestMatch = cutterNumber;
            } else {
                // ถ้าคำที่ค้นหามีค่าน้อยกว่าชื่อในตาราง
                // แสดงว่าเราค้นหาเลยจุดที่ถูกต้องมาแล้ว
                // ให้หยุดค้นหาทันที เพราะรายการถูกเรียงลำดับไว้แล้ว
                break;
            }
        }
        
        if (bestMatch) {
            // พบผลลัพธ์ที่ใกล้เคียงที่สุด
            return { result: bestMatch, color: 'var(--secondary-color)' };
        } else {
            // ถ้าวนจนจบแล้วยังไม่เจอ (เช่น พิมพ์ "ก" แต่ข้อมูลเริ่มที่ "น")
            return { result: notFoundMessage, color: '#e74c3c' };
        }
    }

    // 3. เพิ่ม Event Listener ให้กับช่องค้นหา
    authorInput.addEventListener('input', () => {
        const query = authorInput.value;
        const searchResult = findCutterNumber(query);
        
        // อัปเดตผลลัพธ์และสี
        resultDisplay.textContent = searchResult.result;
        resultDisplay.style.color = searchResult.color;
    });

    // 4. เริ่มโหลดและเตรียมข้อมูลทันที
    setupCutterData();
});