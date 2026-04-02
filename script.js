let cutterData = {};
let sortedKeys = [];

// โหลดข้อมูล JSON เมื่อเปิดหน้าเว็บ
async function loadData() {
    try {
        const response = await fetch('cutter_data.json');
        cutterData = await response.json();
        // จัดเรียง Key ตามลำดับพจนานุกรมไทย
        sortedKeys = Object.keys(cutterData).sort((a, b) => a.localeCompare(b, 'th'));
    } catch (error) {
        console.error("ไม่สามารถโหลดข้อมูลได้", error);
        document.getElementById('result').innerText = "ข้อผิดพลาด: โหลดข้อมูลไม่สำเร็จ";
    }
}

// ฟังก์ชันค้นหาและเทียบตาราง
function findCutterNumber(input) {
    if (!input) return "- รอการค้นหา -";
    
    // อัลกอริทึมค้นหาคำที่ใกล้เคียงที่สุด (Binary Search แบบประยุกต์)
    let bestMatch = "";
    for (let i = 0; i < sortedKeys.length; i++) {
        // ถ้าคีย์ในตารางน้อยกว่าหรือเท่ากับคำค้นหา ให้จำค่าไว้
        if (sortedKeys[i].localeCompare(input, 'th') <= 0) {
            bestMatch = sortedKeys[i];
        } else {
            // ถ้าคีย์ในตารางเริ่มมากกว่าคำค้นหา ให้หยุดและใช้ค่าล่าสุด
            break; 
        }
    }

    if (bestMatch !== "") {
        return cutterData[bestMatch];
    }
    return "ไม่พบข้อมูล";
}

// ผูกอีเวนต์กับช่องพิมพ์
document.getElementById('authorInput').addEventListener('input', function(e) {
    const inputText = e.target.value.trim();
    const resultText = findCutterNumber(inputText);
    document.getElementById('result').innerText = resultText;
});

// เรียกใช้งานตอนโหลดเว็บ
loadData();