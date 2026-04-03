document.addEventListener('DOMContentLoaded', () => {
    const authorInput = document.getElementById('authorInput');
    const resultDisplay = document.getElementById('result');
    const cutterTypeSelect = document.getElementById('cutterType');
    const copyWrapper = document.getElementById('copyWrapper');

    let thaiSortedList = [];
    let sanbornSortedList =[];
    let isThaiLoaded = false;
    let isSanbornLoaded = false;

    const initialMessage = '- รอการค้นหา -';
    const notFoundMessage = 'ไม่พบข้อมูล';
    const errorMessage = 'เกิดข้อผิดพลาดในการโหลดข้อมูล';

    // ฟังก์ชันโหลดข้อมูลและจัดเรียงเพื่อการค้นหา
    async function loadData(url, type) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            
            // แก้ไข Trailing comma จากรูปแบบ Python
            const cleanedText = text.replace(/,\s*}/g, '}');
            const data = JSON.parse(cleanedText);
            
            const expandedData = [];
            
            Object.entries(data).forEach(([key, value]) => {
                if (type === 'thai' && key.includes(',')) {
                    key.split(',').forEach(k => {
                        expandedData.push([k.trim(), value]);
                    });
                } else {
                    expandedData.push([key.trim(), value]);
                }
            });

            expandedData.sort((a, b) => {
                return type === 'thai' ? a[0].localeCompare(b[0], 'th') : a[0].localeCompare(b[0], 'en');
            });
            
            return expandedData;
        } catch (error) {
            console.error(`Could not load data from ${url}:`, error);
            return null;
        }
    }

    async function init() {
        authorInput.disabled = true;
        authorInput.placeholder = "กำลังโหลดฐานข้อมูล...";

        const [thaiData, sanbornData] = await Promise.all([
            loadData('Thai_cutter.py', 'thai'),
            loadData('Sanborn_cutter.py', 'sanborn')
        ]);

        if (thaiData) {
            thaiSortedList = thaiData;
            isThaiLoaded = true;
        }
        if (sanbornData) {
            sanbornSortedList = sanbornData;
            isSanbornLoaded = true;
        }

        authorInput.disabled = false;
        updatePlaceholder();
        
        if (authorInput.value) {
            handleSearch();
        }

        // Initialize Copy Button GSAP Animation
        initButtonEffect();
    }

    function updatePlaceholder() {
        const type = cutterTypeSelect.value;
        if (type === 'thai') {
            authorInput.placeholder = "เช่น นิภา, มงคล, สุชาติ...";
        } else if (type === 'sanborn') {
            authorInput.placeholder = "เช่น Abbott, Smith, Taylor...";
        } else if (type === 'english') {
            authorInput.placeholder = "เช่น Adams, Queen, The United States...";
        }
        
        authorInput.value = '';
        resultDisplay.textContent = initialMessage;
        resultDisplay.style.color = '#fff';
        copyWrapper.style.display = 'none'; // ซ่อนปุ่มก็อปปี้
    }

    function findInList(query, sortedList, locale) {
        if (!query) return { result: initialMessage, color: '#fff' };
        
        const normalizedQuery = query.trim();
        
        for (let i = sortedList.length - 1; i >= 0; i--) {
            const [primaryName, cutterNumber] = sortedList[i];
            
            const q = locale === 'en' ? normalizedQuery.toLowerCase() : normalizedQuery;
            const p = locale === 'en' ? primaryName.toLowerCase() : primaryName;

            if (q.localeCompare(p, locale) >= 0) {
                return { result: cutterNumber, color: 'var(--secondary-color, #4dabf7)' };
            }
        }
        return { result: notFoundMessage, color: '#e74c3c' };
    }

    // ลอจิก LC Cutter แบบไม่นับ A, An, The และให้ผลลัพธ์เป็น ตัวอักษร 1 ตัว + เลข 3 ตัว (รวมเป็น 4 หลัก)
    function calculateLCCutter(name) {
        if (!name) return { result: initialMessage, color: '#fff' };
        
        // ลบคำนำหน้า A, An, The (แบบ case-insensitive) แล้วทำเป็นตัวพิมพ์ใหญ่
        name = name.replace(/^(A|AN|THE)\s+/i, '').trim().toUpperCase();
        
        if (name.length === 0) return { result: initialMessage, color: '#fff' };

        let cutter = name.charAt(0);
        let remaining = name.substring(1).toLowerCase();
        
        const getVowelNum = (c) => {
            if (c < 'd') return '2'; if (c < 'l') return '3'; if (c < 'n') return '4';
            if (c < 'p') return '5'; if (c < 'r') return '6'; if (c < 's') return '7';
            if (c < 'u') return '8'; return '9';
        };

        const getSNum = (c) => {
            if (c < 'c') return '2'; if (c < 'e') return '3'; if (c < 'h') return '4';
            if (c < 'm') return '5'; if (c < 't') return '6'; if (c < 'u') return '7';
            if (c < 'w') return '8'; return '9';
        };

        const getQuNum = (c) => {
            if (c < 'e') return '3'; if (c < 'i') return '4'; if (c < 'o') return '5';
            if (c < 'r') return '6'; if (c < 't') return '7'; if (c < 'y') return '8';
            return '9';
        };

        const getConsonantNum = (c) => {
            if (c < 'e') return '3'; if (c < 'i') return '4'; if (c < 'o') return '5';
            if (c < 'r') return '6'; if (c < 'u') return '7'; if (c < 'y') return '8';
            return '9';
        };

        const getExpansionNum = (c) => {
            if (c < 'e') return '3'; if (c < 'i') return '4'; if (c < 'm') return '5';
            if (c < 'p') return '6'; if (c < 't') return '7'; if (c < 'w') return '8';
            return '9';
        };

        if (['A','E','I','O','U'].includes(cutter)) {
            cutter += getVowelNum(remaining.charAt(0) || '');
            remaining = remaining.substring(1);
        } else if (cutter === 'S') {
            cutter += getSNum(remaining.charAt(0) || '');
            remaining = remaining.substring(1);
        } else if (cutter === 'Q') {
            let c = remaining.charAt(0) || '';
            if (c === 'u') {
                cutter += getQuNum(remaining.charAt(1) || '');
                remaining = remaining.substring(2);
            } else {
                cutter += '2';
                remaining = remaining.substring(1);
            }
        } else {
            cutter += getConsonantNum(remaining.charAt(0) || '');
            remaining = remaining.substring(1);
        }

        for (let i = 0; i < remaining.length; i++) {
            let ch = remaining.charAt(i);
            if (ch >= 'a' && ch <= 'z') {
                cutter += getExpansionNum(ch);
            }
        }

        // กำจัดความยาวให้อยู่ที่สูงสุด 4 ตัว (1 ตัวอักษร + 3 ตัวเลข)
        cutter = cutter.substring(0, 4);

        return { result: cutter, color: 'var(--secondary-color, #4dabf7)' };
    }

    function handleSearch() {
        const query = authorInput.value;
        const type = cutterTypeSelect.value;
        let searchResult;
        
        if (type === 'thai') {
            if (!isThaiLoaded) searchResult = { result: errorMessage, color: '#e74c3c' };
            else searchResult = findInList(query, thaiSortedList, 'th');
        } else if (type === 'sanborn') {
            if (!isSanbornLoaded) searchResult = { result: errorMessage, color: '#e74c3c' };
            else searchResult = findInList(query, sanbornSortedList, 'en');
        } else if (type === 'english') {
            searchResult = calculateLCCutter(query);
        }
        
        resultDisplay.textContent = searchResult.result;
        resultDisplay.style.color = searchResult.color;

        // แสดงหรือซ่อนปุ่มคัดลอกเมื่อมีผลลัพธ์
        if (searchResult.result !== initialMessage && searchResult.result !== notFoundMessage && searchResult.result !== errorMessage) {
            copyWrapper.style.display = 'flex';
        } else {
            copyWrapper.style.display = 'none';
        }
    }

    cutterTypeSelect.addEventListener('change', updatePlaceholder);
    authorInput.addEventListener('input', handleSearch);

    // ระบบอนิเมชั่นและปุ่มคัดลอกด้วย GSAP
    function initButtonEffect() {
        $('.button--bubble').each(function() {
            var $circlesTopLeft = $(this).parent().find('.circle.top-left');
            var $circlesBottomRight = $(this).parent().find('.circle.bottom-right');

            var tl = new TimelineLite();
            var tl2 = new TimelineLite();
            var btTl = new TimelineLite({ paused: true });

            tl.to($circlesTopLeft, 1.2, { x: -25, y: -25, scaleY: 2, ease: SlowMo.ease.config(0.1, 0.7, false) });
            tl.to($circlesTopLeft.eq(0), 0.1, { scale: 0.2, x: '+=6', y: '-=2' });
            tl.to($circlesTopLeft.eq(1), 0.1, { scaleX: 1, scaleY: 0.8, x: '-=10', y: '-=7' }, '-=0.1');
            tl.to($circlesTopLeft.eq(2), 0.1, { scale: 0.2, x: '-=15', y: '+=6' }, '-=0.1');
            tl.to($circlesTopLeft.eq(0), 1, { scale: 0, x: '-=5', y: '-=15', opacity: 0 });
            tl.to($circlesTopLeft.eq(1), 1, { scaleX: 0.4, scaleY: 0.4, x: '-=10', y: '-=10', opacity: 0 }, '-=1');
            tl.to($circlesTopLeft.eq(2), 1, { scale: 0, x: '-=15', y: '+=5', opacity: 0 }, '-=1');

            var tlBt1 = new TimelineLite();
            var tlBt2 = new TimelineLite();
            
            tlBt1.set($circlesTopLeft, { x: 0, y: 0, rotation: -45 });
            tlBt1.add(tl);

            tl2.set($circlesBottomRight, { x: 0, y: 0 });
            tl2.to($circlesBottomRight, 1.1, { x: 30, y: 30, ease: SlowMo.ease.config(0.1, 0.7, false) });
            tl2.to($circlesBottomRight.eq(0), 0.1, { scale: 0.2, x: '-=6', y: '+=3' });
            tl2.to($circlesBottomRight.eq(1), 0.1, { scale: 0.8, x: '+=7', y: '+=3' }, '-=0.1');
            tl2.to($circlesBottomRight.eq(2), 0.1, { scale: 0.2, x: '+=15', y: '-=6' }, '-=0.2');
            tl2.to($circlesBottomRight.eq(0), 1, { scale: 0, x: '+=5', y: '+=15', opacity: 0 });
            tl2.to($circlesBottomRight.eq(1), 1, { scale: 0.4, x: '+=7', y: '+=7', opacity: 0 }, '-=1');
            tl2.to($circlesBottomRight.eq(2), 1, { scale: 0, x: '+=15', y: '-=5', opacity: 0 }, '-=1');
            
            tlBt2.set($circlesBottomRight, { x: 0, y: 0, rotation: 45 });
            tlBt2.add(tl2);

            btTl.add(tlBt1);
            btTl.to($(this).parent().find('.button.effect-button'), 0.8, { scaleY: 1.1 }, 0.1);
            btTl.add(tlBt2, 0.2);
            btTl.to($(this).parent().find('.button.effect-button'), 1.8, { scale: 1, ease: Elastic.easeOut.config(1.2, 0.4) }, 1.2);

            btTl.timeScale(2.6);

            $(this).on('mouseover', function() {
                btTl.restart();
            });
        });

        // ฟังก์ชันคัดลอก (Copy to Clipboard)
        $('#copyButton').on('click', function(e) {
            e.preventDefault();
            const textToCopy = $('#result').text();
            
            if (textToCopy && textToCopy !== initialMessage && textToCopy !== notFoundMessage) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const $btn = $(this);
                    const originalText = "คัดลอก (Copy)";
                    $btn.text('คัดลอกสำเร็จ!');
                    setTimeout(() => {
                        $btn.text(originalText);
                    }, 2000);
                });
            }
        });
    }

    init();
});