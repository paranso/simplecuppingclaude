// app.js

const { useState, useEffect } = React;

// =======================================================================
// !! 중요 !! 여기에 2단계에서 복사한 Google Apps Script 웹 앱 URL을 붙여넣으세요!
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby1coezOe5iRN1ZwdWhzk6unvGt39-gDO_PmZ59OavJ-SeTqWx2EIr6oujdEJt5ZlQ7rA/exec';
// =======================================================================

const SimpleCuppingForm = () => {
    // --- 상태 관리 ---
    const initialFormData = {
        roastingDate: '', cuppingDate: '', coffeeName: '', dropTime: '', agtronNumber: ''
    };
    const initialScores = { aroma: 3, acidity: 3, sweetness: 3, body: 3, aftertaste: 3 };
    const initialCustomNotes = { 꽃: '', 과일류: '', 허브: '', 견과류: '', 캐러멜: '', 초콜릿: '', 디펙트: '' };

    const [formData, setFormData] = useState(initialFormData);
    const [scores, setScores] = useState(initialScores);
    const [selectedAromas, setSelectedAromas] = useState([]);
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [notes, setNotes] = useState('');
    const [customNotes, setCustomNotes] = useState(initialCustomNotes);
    const [roastingNotes, setRoastingNotes] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [showSummary, setShowSummary] = useState(false); // 요약 섹션 표시 여부 상태 추가
    const [summaryData, setSummaryData] = useState(null); // 요약 데이터 상태 추가

    const aromaWheel = {
        '꽃': ['장미', '자스민', '라일락', '커피블라썸', '오렌지꽃'],
        '과일류': ['감귤류(오렌지/레몬)', '베리류', '열대과일', '사과/배', '자두/체리'],
        '허브': ['민트', '캐모마일', '라벤더', '로즈마리', '타임'],
        '견과류': ['아몬드', '헤이즐넛', '피칸', '땅콩', '호두'],
        '캐러멜': ['흑설탕', '버터스카치', '메이플시럽', '토피', '캔디'],
        '초콜릿': ['다크초콜릿', '밀크초콜릿', '코코아', '초콜릿시럽', '모카'],
        '디펙트': ['언더', '오버', '베이크드', '몰디', '메탈릭', '과발효']
    };
     const scoreLabels = { aroma: '향', acidity: '산미', sweetness: '단맛', body: '바디감', aftertaste: '후미' };
     const scoreDescriptions = {
         aroma: 'Fragrance(분쇄향) / Aroma(습식향)', acidity: '신맛의 정도와 특성',
         sweetness: '자연스러운 단맛', body: '입안의 무게감/질감', aftertaste: '긍정적 맛/향의 지속성'
     };

    // --- 핸들러 함수들 ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleScoreChange = (category, value) => {
        setScores(prev => ({ ...prev, [category]: parseInt(value) }));
    };

    const handleAromaSelect = (aroma) => {
        setSelectedAromas(prev =>
            prev.includes(aroma) ? prev.filter(a => a !== aroma) : [...prev, aroma]
        );
    };

    const handleCategoryClick = (category) => {
        setExpandedCategory(expandedCategory === category ? null : category);
    };

    const handleCustomNotesChange = (category, value) => {
        setCustomNotes(prev => ({ ...prev, [category]: value }));
    };

    // --- 유틸리티 함수 ---
    const getRecommendation = () => {
        let recommendations = [];
        if (scores.acidity > 3) recommendations.push("산미 강함: 로스팅 온도 약간 상승 고려.");
        if (scores.body < 3) recommendations.push("바디감 부족: 디벨롭 시간 증가 고려.");
        if (scores.sweetness < 3) recommendations.push("단맛 부족: 첫 크랙 후 시간 증가 고려.");
        return recommendations.join(' ');
    };

    // --- 데이터 저장 함수 (핵심 수정) ---
    const handleSave = async () => { // 함수 이름 변경 handleSaveToSheet -> handleSave
        if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === '여기에_복사한_Apps_Script_웹_앱_URL_붙여넣기') {
            setStatusMessage('오류: Google Apps Script URL이 설정되지 않았습니다. app.js 파일을 확인하세요.');
            setShowSummary(false); // 오류 시 요약 숨김
            return;
        }
        if (isSubmitting) return;

        setIsSubmitting(true);
        setStatusMessage('저장 중...');
        setShowSummary(false); // 저장 시작 시 이전 요약 숨김

        const recommendation = getRecommendation(); // 추천 내용 미리 계산
        const currentCustomNotesString = JSON.stringify(customNotes); // 현재 customNotes 상태를 문자열로

        // Apps Script로 보낼 데이터 객체 구성
        const dataToSend = {
            roastingDate: formData.roastingDate,
            cuppingDate: formData.cuppingDate,
            coffeeName: formData.coffeeName,
            dropTimeTemp: formData.dropTime,
            agtron: formData.agtronNumber,
            aromaScore: scores.aroma,
            acidityScore: scores.acidity,
            sweetnessScore: scores.sweetness,
            bodyScore: scores.body,
            aftertasteScore: scores.aftertaste,
            detectedFlavors: selectedAromas.join(', '),
            detailedAromaNotes: currentCustomNotesString, // 위에서 만든 문자열 사용
            additionalNotes: notes,
            roastingNotes: roastingNotes,
            roastingRecommendation: recommendation // 위에서 계산한 추천 내용
        };

        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(dataToSend)
            });

            if (!response.ok) {
                 throw new Error(`서버 응답 오류: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            if (result.status === 'success') {
                setStatusMessage('성공: 데이터가 저장되었습니다.');
                // 저장 성공 시, 현재 폼 데이터를 요약 데이터로 설정하고 요약 표시
                setSummaryData({ // 저장된 데이터를 기반으로 요약 데이터 생성
                    ...formData, // 기본 정보
                    ...scores,   // 점수
                    selectedAromas: selectedAromas, // 선택된 향미 배열
                    notes: notes, // 추가 노트
                    customNotes: customNotes, // 향미 세부 노트 객체
                    roastingNotes: roastingNotes, // 로스팅 노트
                    recommendation: recommendation // 자동 추천
                });
                setShowSummary(true); // 요약 섹션 표시
                // 성공 후 폼 초기화 (선택 사항)
                // resetForm();
            } else {
                setStatusMessage('실패: ' + (result.message || '알 수 없는 오류가 발생했습니다.'));
                console.error("Apps Script Error:", result);
                setShowSummary(false); // 실패 시 요약 숨김
            }

        } catch (error) {
            console.error('데이터 저장 중 네트워크 또는 스크립트 오류 발생:', error);
            setStatusMessage(`오류 발생: ${error.message}. 개발자 콘솔을 확인하세요.`);
            setShowSummary(false); // 오류 시 요약 숨김
        } finally {
            setIsSubmitting(false);
        }
    };

    // 폼 초기화 함수 (필요시 사용)
    const resetForm = () => {
        setFormData(initialFormData);
        setScores(initialScores);
        setSelectedAromas([]);
        setExpandedCategory(null);
        setNotes('');
        setCustomNotes(initialCustomNotes);
        setRoastingNotes('');
        setShowSummary(false); // 폼 초기화 시 요약 숨김
        // setStatusMessage('');
    };

    // --- 요약 결과 표시 컴포넌트 ---
    const ResultSummary = ({ data }) => {
        if (!data) return null;

        return (
            <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-4 text-green-800">저장된 결과 요약</h2>
                <div className="space-y-3 text-sm">
                    <p><strong className="font-semibold">커피명:</strong> {data.coffeeName}</p>
                    <p><strong className="font-semibold">로스팅 날짜:</strong> {data.roastingDate}</p>
                    <p><strong className="font-semibold">커핑 날짜:</strong> {data.cuppingDate}</p>
                    <p><strong className="font-semibold">배출 시간/온도:</strong> {data.dropTime}</p>
                    <p><strong className="font-semibold">Agtron#:</strong> {data.agtronNumber}</p>
                    <div className="pt-2 mt-2 border-t">
                         <h4 className="font-semibold mb-1">평가 점수:</h4>
                         {Object.entries(scoreLabels).map(([key, label]) => (
                             <p key={key}>{label}: {data[key]}/5</p>
                         ))}
                    </div>
                    {data.selectedAromas && data.selectedAromas.length > 0 && (
                        <div className="pt-2 mt-2 border-t">
                            <h4 className="font-semibold mb-1">감지된 향미:</h4>
                            <p>{data.selectedAromas.join(', ')}</p>
                        </div>
                    )}
                     {/* 향미 세부 노트 요약 (간단히 표시하거나 필요시 더 자세히) */}
                    {/* {Object.entries(data.customNotes || {}).filter(([key, value]) => value).length > 0 && (
                        <div className="pt-2 mt-2 border-t">
                             <h4 className="font-semibold mb-1">향미 세부 노트:</h4>
                             {Object.entries(data.customNotes).filter(([key, value]) => value).map(([key, value]) => (
                                 <p key={key}><strong>{key}:</strong> {value}</p>
                             ))}
                        </div>
                    )} */}
                    {data.notes && (
                        <div className="pt-2 mt-2 border-t">
                            <h4 className="font-semibold mb-1">추가 메모:</h4>
                            <p className="whitespace-pre-wrap">{data.notes}</p>
                        </div>
                    )}
                    {data.roastingNotes && (
                        <div className="pt-2 mt-2 border-t">
                            <h4 className="font-semibold mb-1">로스팅 노트:</h4>
                            <p className="whitespace-pre-wrap">{data.roastingNotes}</p>
                        </div>
                    )}
                     {data.recommendation && (
                        <div className="pt-2 mt-2 border-t">
                            <h4 className="font-semibold mb-1">자동 추천:</h4>
                            <p>{data.recommendation}</p>
                        </div>
                    )}
                </div>
                 <button
                     onClick={() => setShowSummary(false)} // 닫기 버튼 추가
                     className="mt-4 px-4 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                 >
                     요약 닫기
                 </button>
            </div>
        );
    };


    // --- UI 렌더링 ---
    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold text-center mb-6">Simple Cupping Form</h1>

                {/* --- 폼 입력 필드들 (기존과 동일) --- */}
                 {/* 기본 정보 */}
                 <div className="mb-8 border-b pb-6">
                     <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                         <div><label className="block text-sm font-medium mb-1">로스팅 날짜</label><input type="date" name="roastingDate" value={formData.roastingDate} onChange={handleInputChange} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                         <div><label className="block text-sm font-medium mb-1">커핑 날짜</label><input type="date" name="cuppingDate" value={formData.cuppingDate} onChange={handleInputChange} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                     </div>
                     <div className="mb-4"><label className="block text-sm font-medium mb-1">커피 정보</label><input type="text" name="coffeeName" value={formData.coffeeName} onChange={handleInputChange} placeholder="커피이름, 농장명, 프로세싱 등" className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-300"/></div>
                     <div className="grid grid-cols-2 gap-4">
                         <div><label className="block text-sm font-medium mb-1">배출시간과 온도</label><input type="text" name="dropTime" value={formData.dropTime} onChange={handleInputChange} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                         <div><label className="block text-sm font-medium mb-1">Agtron#</label><input type="text" name="agtronNumber" value={formData.agtronNumber} onChange={handleInputChange} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                     </div>
                 </div>

                 {/* 평가 항목 */}
                 <div className="mb-8 border-b pb-6">
                    <h2 className="text-lg font-semibold mb-4">평가 항목</h2>
                    {Object.entries(scores).map(([category, value]) => (
                        <div key={category} className="mb-6">
                            <label className="block text-sm font-medium mb-1">{scoreLabels[category]} <span className="ml-2 text-gray-500 font-semibold">{value}</span> / 5</label>
                            <p className="text-xs text-gray-400 mb-2">{scoreDescriptions[category]}</p>
                            <input type="range" min="1" max="5" value={value} onChange={(e) => handleScoreChange(category, e.target.value)} className="w-full mb-1 cursor-pointer"/>
                            <div className="flex justify-between text-xs text-gray-500"><span>1 (약함)</span><span>3 (보통)</span><span>5 (강함)</span></div>
                        </div>
                    ))}
                </div>

                {/* 아로마 휠 */}
                <div className="mb-8 border-b pb-6">
                    <h2 className="text-lg font-semibold mb-4">향미 특성 (Aroma Wheel)</h2>
                    {Object.entries(aromaWheel).map(([category, aromas]) => (
                        <div key={category} className="mb-2 border rounded">
                            <button onClick={() => handleCategoryClick(category)} className="w-full text-left p-3 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex justify-between items-center">
                                <span>{category}</span>
                                <span className={`transform transition-transform duration-200 ${expandedCategory === category ? 'rotate-180' : ''}`}>▼</span>
                            </button>
                            {expandedCategory === category && (
                                <div className="p-3 bg-gray-50 border-t">
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {aromas.map(aroma => (
                                            <button key={aroma} onClick={() => handleAromaSelect(aroma)}
                                                className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedAromas.includes(aroma) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-blue-300`}>
                                                {aroma}
                                            </button>
                                        ))}
                                    </div>
                                    <textarea value={customNotes[category]} onChange={(e) => handleCustomNotesChange(category, e.target.value)} placeholder={`${category} 상세 노트...`} className="w-full p-2 border rounded h-20 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                 {/* 선택된 향미 표시 */}
                {selectedAromas.length > 0 && (
                    <div className="mb-8 border-b pb-6">
                        <h3 className="text-md font-semibold mb-2">감지된 주요 향미:</h3>
                        <div className="flex flex-wrap gap-2">
                            {selectedAromas.map(aroma => (<span key={aroma} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">{aroma}</span>))}
                        </div>
                    </div>
                )}

                {/* 메모 */}
                <div className="mb-8 border-b pb-6">
                    <h2 className="text-lg font-semibold mb-4">추가 메모</h2>
                     <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="전체적인 인상, 질감, 밸런스 등 자유롭게 기록..." className="w-full h-24 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"/>
                </div>

                {/* 로스팅 노트 및 추천 */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4">로스팅 노트 및 추천</h2>
                    <textarea value={roastingNotes} onChange={(e) => setRoastingNotes(e.target.value)} placeholder="로스팅 프로파일, 특이사항, 개선 방향 등 기록..." className="w-full h-24 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y mb-2"/>
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                        <p className="font-medium mb-1">자동 추천:</p>
                        <p>{getRecommendation() || "특별한 추천 사항 없음."}</p>
                    </div>
                </div>

                {/* 저장 버튼 및 상태 메시지 */}
                <div className="mt-8 flex flex-col items-center">
                    <button
                        onClick={handleSave} // 변경된 함수 호출, 텍스트 변경
                        disabled={isSubmitting}
                        className={`w-full md:w-1/2 px-6 py-3 text-white font-semibold rounded shadow-md transition-colors duration-200 ${isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    >
                        {isSubmitting ? '저장 중...' : '저장'} {/* 버튼 텍스트 변경 */}
                    </button>
                    {statusMessage && (
                        <p className={`mt-4 text-sm text-center ${statusMessage.startsWith('성공') ? 'text-green-600' : statusMessage.startsWith('오류') || statusMessage.startsWith('실패') ? 'text-red-600' : 'text-gray-700'}`}>
                            {statusMessage}
                        </p>
                    )}
                </div>

                {/* --- 결과 요약 표시 섹션 (저장 성공 시 나타남) --- */}
                {showSummary && <ResultSummary data={summaryData} />}

            </div>
        </div>
    );
};

// --- React 앱 렌더링 ---
const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<SimpleCuppingForm />);
} else {
    console.error("Root element with id 'root' not found.");
}
