document.addEventListener('DOMContentLoaded', () => {
    const authorInput = document.getElementById('authorInput');
    const resultDisplay = document.getElementById('result');
    const copyWrapper = document.getElementById('copyWrapper');
    const lcDigitsContainer = document.getElementById('lcDigitsContainer');
    
    // UI สำหรับตารางดัชนี (Context UI)
    const contextWrapper = document.getElementById('contextWrapper');
    const prevRow = document.getElementById('prevRow');
    const nextRow = document.getElementById('nextRow');
    const mainLabel = document.getElementById('mainLabel');
    const mainName = document.getElementById('mainName');
    
    // ดึงค่า Switch Radio Buttons
    const cutterTypeRadios = document.querySelectorAll('input[name="cutterType"]');
    const lcDigitsRadios = document.querySelectorAll('input[name="lcDigits"]');

    let thaiSortedList = [];
    let sanbornSortedList =[];
    let isThaiLoaded = false;
    let isSanbornLoaded = false;

    const initialMessage = '- รอการค้นหา -';
    const notFoundMessage = 'ไม่พบข้อมูล';
    const errorMessage = 'เกิดข้อผิดพลาดในการโหลดข้อมูล';

    function getSelectedCutterType() {
        return document.querySelector('input[name="cutterType"]:checked').value;
    }

    function getSelectedLCDigits() {
        return parseInt(document.querySelector('input[name="lcDigits"]:checked').value, 10);
    }

    async function loadData(url, type) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            
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

            // เรียงลำดับตัวอักษร A-Z / ก-ฮ
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
        updateUI();
        
        if (authorInput.value) {
            handleSearch();
        }

        initButtonEffect();
        initVisitorCounter();
    }

    function updateUI() {
        const type = getSelectedCutterType();
        
        if (type === 'thai') {
            authorInput.placeholder = "เช่น นิภา, มงคล, สุชาติ...";
            lcDigitsContainer.style.display = 'none'; 
        } else if (type === 'sanborn') {
            authorInput.placeholder = "เช่น Abbott, Smith, Taylor...";
            lcDigitsContainer.style.display = 'none'; 
        } else if (type === 'english') {
            authorInput.placeholder = "เช่น Adams, Queen, The United States...";
            lcDigitsContainer.style.display = 'block'; 
        }
        
        authorInput.value = '';
        handleSearch(); // รีเซ็ตผลลัพธ์ให้กลับไปสถานะเริ่มต้น
    }

    // ลอจิกการหาในฐานข้อมูล พร้อมคืนค่า ก่อนหน้า และ ถัดไป
    function findInList(query, sortedList, locale) {
        if (!query) return { result: initialMessage, color: '#fff', isList: false, matchedName: '' };
        
        const normalizedQuery = query.trim();
        
        // วนลูปจากหลังมาหน้า (ฮ->ก) เพื่อหาจุดที่เหมาะสมที่สุด (มากที่สุดที่ยังน้อยกว่าหรือเท่ากับ Query)
        for (let i = sortedList.length - 1; i >= 0; i--) {
            const [primaryName, cutterNumber] = sortedList[i];
            const q = locale === 'en' ? normalizedQuery.toLowerCase() : normalizedQuery;
            const p = locale === 'en' ? primaryName.toLowerCase() : primaryName;

            if (q.localeCompare(p, locale) >= 0) {
                const cleanedCutter = cutterNumber.replace(/\s+/g, '');
                return { 
                    result: cleanedCutter, 
                    color: 'var(--secondary-color, #4dabf7)',
                    isList: true,
                    matchedName: primaryName,
                    prev: (i - 1) >= 0 ? sortedList[i - 1] : null,
                    next: (i + 1) < sortedList.length ? sortedList[i + 1] : null
                };
            }
        }
        return { result: notFoundMessage, color: '#e74c3c', isList: false, matchedName: '' };
    }

    // ลอจิก LC Cutter (ไม่มีก่อนหน้า/ถัดไป)
    function calculateLCCutter(name) {
        if (!name) return { result: initialMessage, color: '#fff', isList: false, matchedName: '' };
        
        const displayName = name.replace(/^(A|AN|THE)\s+/i, '').trim();
        name = displayName.toUpperCase();
        
        if (name.length === 0) return { result: initialMessage, color: '#fff', isList: false, matchedName: '' };

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
            if (c < 'r') return '6'; if (c < 't') return '7'; if (c < 'y') return '8'; return '9';
        };
        const getConsonantNum = (c) => {
            if (c < 'e') return '3'; if (c < 'i') return '4'; if (c < 'o') return '5';
            if (c < 'r') return '6'; if (c < 'u') return '7'; if (c < 'y') return '8'; return '9';
        };
        const getExpansionNum = (c) => {
            if (c < 'e') return '3'; if (c < 'i') return '4'; if (c < 'm') return '5';
            if (c < 'p') return '6'; if (c < 't') return '7'; if (c < 'w') return '8'; return '9';
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

        const digitsSelected = getSelectedLCDigits();
        const maxLength = digitsSelected + 1; 
        cutter = cutter.substring(0, maxLength);

        return { result: cutter, color: 'var(--secondary-color, #4dabf7)', isList: false, matchedName: displayName };
    }

    function handleSearch() {
        const query = authorInput.value;
        const type = getSelectedCutterType();
        let searchResult;
        
        if (type === 'thai') {
            if (!isThaiLoaded) searchResult = { result: errorMessage, color: '#e74c3c', isList: false, matchedName: '' };
            else searchResult = findInList(query, thaiSortedList, 'th');
        } else if (type === 'sanborn') {
            if (!isSanbornLoaded) searchResult = { result: errorMessage, color: '#e74c3c', isList: false, matchedName: '' };
            else searchResult = findInList(query, sanbornSortedList, 'en');
        } else if (type === 'english') {
            searchResult = calculateLCCutter(query);
        }
        
        // จัดการแสดงผล UI แบบตารางดัชนี
        if (searchResult.result === initialMessage || searchResult.result === notFoundMessage || searchResult.result === errorMessage) {
            contextWrapper.classList.add('single-mode');
            prevRow.style.display = 'none';
            nextRow.style.display = 'none';
            mainName.textContent = '';
            mainLabel.textContent = '';
            resultDisplay.classList.add('center-text');
        } else {
            resultDisplay.classList.remove('center-text');
            if (searchResult.isList) {
                // สำหรับแบบมีฐานข้อมูล (แสดง 3 บรรทัด)
                contextWrapper.classList.remove('single-mode');
                prevRow.style.display = 'flex';
                nextRow.style.display = 'flex';
                mainLabel.textContent = '▶ ปัจจุบัน';
                mainName.textContent = searchResult.matchedName;
                
                // ข้อมูลก่อนหน้า
                if (searchResult.prev) {
                    document.getElementById('prevName').textContent = searchResult.prev[0];
                    document.getElementById('prevCutter').textContent = searchResult.prev[1].replace(/\s+/g, '');
                } else {
                    document.getElementById('prevName').textContent = '-';
                    document.getElementById('prevCutter').textContent = '-';
                }
                
                // ข้อมูลถัดไป
                if (searchResult.next) {
                    document.getElementById('nextName').textContent = searchResult.next[0];
                    document.getElementById('nextCutter').textContent = searchResult.next[1].replace(/\s+/g, '');
                } else {
                    document.getElementById('nextName').textContent = '-';
                    document.getElementById('nextCutter').textContent = '-';
                }
            } else {
                // สำหรับ LC Cutter (แสดงแค่ผลลัพธ์ ไม่แสดงหน้า/หลัง)
                contextWrapper.classList.add('single-mode');
                prevRow.style.display = 'none';
                nextRow.style.display = 'none';
                mainLabel.textContent = '▶ ชื่อผู้แต่ง';
                mainName.textContent = searchResult.matchedName;
            }
        }
        
        // ใส่ข้อมูลลงในตัวเลขผลลัพธ์
        resultDisplay.textContent = searchResult.result;
        resultDisplay.style.color = searchResult.color;

        // แสดงหรือซ่อนปุ่มคัดลอกเมื่อมีผลลัพธ์
        if (searchResult.result !== initialMessage && searchResult.result !== notFoundMessage && searchResult.result !== errorMessage) {
            copyWrapper.style.display = 'flex';
        } else {
            copyWrapper.style.display = 'none';
        }
    }

    cutterTypeRadios.forEach(radio => radio.addEventListener('change', updateUI));
    lcDigitsRadios.forEach(radio => radio.addEventListener('change', handleSearch));
    authorInput.addEventListener('input', handleSearch);

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

    function initVisitorCounter() {
        const namespace = 'cutternumber_app_library'; 
        const key = 'visits'; 
        const viewCountElement = document.getElementById('viewCount');
        
        fetch(`https://api.counterapi.dev/v1/${namespace}/${key}/up`)
            .then(response => response.json())
            .then(data => {
                if (data && data.count) {
                    viewCountElement.innerText = data.count.toLocaleString();
                }
            })
            .catch(error => {
                console.error('Error fetching visitor count:', error);
                viewCountElement.innerText = "-";
            });

        setInterval(() => {
            fetch(`https://api.counterapi.dev/v1/${namespace}/${key}`)
                .then(response => response.json())
                .then(data => {
                    if (data && data.count) {
                        const currentDisplayed = viewCountElement.innerText.replace(/,/g, '');
                        if(currentDisplayed !== data.count.toString() && currentDisplayed !== "-") {
                            viewCountElement.style.transform = "scale(1.3)";
                            viewCountElement.style.color = "#ffffff";
                            setTimeout(() => {
                                viewCountElement.style.transform = "scale(1)";
                                viewCountElement.style.color = "#90feb5";
                            }, 300);
                        }
                        viewCountElement.innerText = data.count.toLocaleString();
                    }
                })
                .catch(error => console.error('Realtime update failed:', error));
        }, 5000);
    }

    init();
});