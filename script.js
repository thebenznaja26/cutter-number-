document.addEventListener('DOMContentLoaded', () => {
    const authorInput = document.getElementById('authorInput');
    const resultDisplay = document.getElementById('result');

    let sortedCutterList = []; // เปลี่ยนมาใช้ Array ที่เรียงลำดับแล้ว
    const initialMessage = '- รอการค้นหา -';
    const notFoundMessage = 'ไม่พบข้อมูล';
    const errorMessage = 'เกิดข้อผิดพลาดในการโหลดข้อมูล';

    // 1. ฟังก์ชันสำหรับโหลดและเตรียมข้อมูล (ไม่มีการแก้ไข)
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

        // **ตรรกะใหม่:** ค้นหาจากท้ายรายการกลับมาด้านหน้า (Search from the end of the list backwards)
        // วิธีนี้จะหา "รายการสุดท้าย" ที่มีชื่อน้อยกว่าหรือเท่ากับคำค้นหาได้อย่างถูกต้องและรวดเร็ว
        // This method correctly and quickly finds the *last item* whose name is less than or equal to the search query.
        for (let i = sortedCutterList.length - 1; i >= 0; i--) {
            const [key, cutterNumber] = sortedCutterList[i];
            const primaryName = key.split(',')[0].trim();

            // ตรวจสอบว่าคำค้นหา (normalizedQuery) มากกว่าหรือเท่ากับชื่อในตาราง (primaryName) หรือไม่
            // ตามหลักการเปรียบเทียบตัวอักษรภาษาไทย
            // Check if the search query is alphabetically greater than or equal to the name in the table.
            if (normalizedQuery.localeCompare(primaryName, 'th') >= 0) {
                // ถ้าใช่, เราเจอรายการที่ถูกต้องแล้ว เพราะเราค้นจากท้ายมา
                // ดังนั้นให้คืนผลลัพธ์และออกจากฟังก์ชันทันที
                // If yes, we've found the correct entry because we're searching from the end.
                // So, return the result and exit the function immediately.
                return { result: cutterNumber, color: 'var(--secondary-color)' };
            }
        }
        
        // ถ้าลูปจนจบแล้วยังไม่เจอ (เช่น พิมพ์ "ก" แต่ข้อมูลเริ่มที่ "น")
        // แสดงว่าคำค้นหาอยู่ก่อนรายการแรกสุดในตาราง
        // If the loop completes without finding a match, the query comes before the very first item in the table.
        return { result: notFoundMessage, color: '#e74c3c' };
    }

    // 3. เพิ่ม Event Listener ให้กับช่องค้นหา (ไม่มีการแก้ไข)
    authorInput.addEventListener('input', () => {
        const query = authorInput.value;
        const searchResult = findCutterNumber(query);
        
        // อัปเดตผลลัพธ์และสี
        resultDisplay.textContent = searchResult.result;
        resultDisplay.style.color = searchResult.color;
    });

    // 4. เริ่มโหลดและเตรียมข้อมูลทันที (ไม่มีการแก้ไข)
    setupCutterData();
});