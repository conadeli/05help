import React, { useState, useRef } from 'react';
import { Volume2, VolumeX, Download, RotateCcw, Upload, Trash2, Mic } from 'lucide-react';
import html2canvas from 'html2canvas';

interface SectionData {
  word: string;
  meaning: string;
  meanings: string[];
  image: string | null;
}

// 실제 번역 API 함수
const translateText = async (text: string, isKorean: boolean = false): Promise<string> => {
  try {
    // 문장인지 단어인지 판단 (공백이 있거나 길이가 긴 경우 문장으로 간주)
    const isSentence = text.trim().includes(' ') || text.trim().length > 15;
    
    if (isKorean) {
      // 한국어를 영어로 번역
      try {
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ko|en`);
        const data = await response.json();
        
        if (data.responseStatus === 200 && data.responseData) {
          return data.responseData.translatedText;
        }
      } catch (error) {
        console.log('한국어 번역 오류:', error);
      }
      
      try {
        const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=en&dt=t&q=${encodeURIComponent(text)}`);
        const data = await response.json();
        
        if (data && data[0] && data[0][0]) {
          return data[0][0][0];
        }
      } catch (error) {
        console.log('구글 번역 오류:', error);
      }
      
      return '번역할 수 없습니다.';
    }
    
    // 문장인 경우 첫 번째 번역 결과만 반환
    if (isSentence) {
      try {
        // 첫 번째 번역 서비스
        const response1 = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ko`);
        const data1 = await response1.json();
        
        if (data1.responseStatus === 200 && data1.responseData) {
          return data1.responseData.translatedText;
        }
      } catch (error) {
        console.log('첫 번째 번역 서비스 오류:', error);
      }
      
      try {
        // 두 번째 번역 서비스 (Google Translate)
        const response2 = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(text)}`);
        const data2 = await response2.json();
        
        if (data2 && data2[0] && data2[0][0]) {
          return data2[0][0][0];
        }
      } catch (error) {
        console.log('두 번째 번역 서비스 오류:', error);
      }
      
      return '번역할 수 없습니다.';
    }
    
    // 영어를 한국어로 번역 (기존 코드)
    // 단어인 경우에만 여러 뜻을 수집
    const meanings: string[] = [];
    
    try {
      // 첫 번째 번역 서비스
      const response1 = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ko`);
      const data1 = await response1.json();
      
      if (data1.responseStatus === 200 && data1.responseData) {
        meanings.push(data1.responseData.translatedText);
      }
      
      // 추가 번역 결과가 있다면 포함
      if (data1.matches && data1.matches.length > 0) {
        data1.matches.slice(0, 3).forEach((match: any) => {
          if (match.translation && !meanings.includes(match.translation)) {
            meanings.push(match.translation);
          }
        });
      }
    } catch (error) {
      console.log('첫 번째 번역 서비스 오류:', error);
    }
    
    try {
      // 두 번째 번역 서비스 (Google Translate)
      const response2 = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(text)}`);
      const data2 = await response2.json();
      
      if (data2 && data2[0] && data2[0][0]) {
        const translation = data2[0][0][0];
        if (!meanings.includes(translation)) {
          meanings.push(translation);
        }
      }
    } catch (error) {
      console.log('두 번째 번역 서비스 오류:', error);
    }
    
    // 단어별 추가 뜻 사전 (자주 사용되는 단어들의 다양한 뜻)
    const additionalMeanings: { [key: string]: string[] } = {
      'run': ['달리다', '운영하다', '작동하다', '흐르다'],
      'play': ['놀다', '연주하다', '경기하다', '역할하다'],
      'get': ['얻다', '가져오다', '이해하다', '도착하다'],
      'make': ['만들다', '하게 하다', '벌다', '도달하다'],
      'take': ['가져가다', '걸리다', '받아들이다', '찍다'],
      'go': ['가다', '떠나다', '작동하다', '진행되다'],
      'come': ['오다', '도착하다', '나타나다', '되다'],
      'see': ['보다', '만나다', '이해하다', '알아보다'],
      'know': ['알다', '알고 있다', '인식하다', '경험하다'],
      'think': ['생각하다', '여기다', '기억하다', '상상하다'],
      'look': ['보다', '찾다', '~처럼 보이다', '주의하다'],
      'want': ['원하다', '필요하다', '부족하다', '찾다'],
      'give': ['주다', '제공하다', '양보하다', '전달하다'],
      'use': ['사용하다', '이용하다', '소비하다', '활용하다'],
      'find': ['찾다', '발견하다', '알아내다', '느끼다'],
      'tell': ['말하다', '알려주다', '구별하다', '명령하다'],
      'ask': ['묻다', '요청하다', '초대하다', '부탁하다'],
      'work': ['일하다', '작동하다', '운동하다', '효과가 있다'],
      'call': ['부르다', '전화하다', '명명하다', '방문하다'],
      'try': ['시도하다', '노력하다', '재판하다', '맛보다'],
      'need': ['필요하다', '요구하다', '해야 하다', '궁핍하다'],
      'feel': ['느끼다', '만지다', '생각하다', '경험하다'],
      'become': ['되다', '어울리다', '생기다', '변하다'],
      'leave': ['떠나다', '남기다', '맡기다', '그만두다'],
      'put': ['놓다', '두다', '넣다', '표현하다'],
      'mean': ['의미하다', '뜻하다', '심술궂은', '평균'],
      'keep': ['유지하다', '지키다', '계속하다', '보관하다'],
      'let': ['허락하다', '~하게 하다', '임대하다', '방해하다'],
      'begin': ['시작하다', '착수하다', '개시하다', '비롯하다'],
      'seem': ['~인 것 같다', '보이다', '나타나다', '생각되다'],
      'help': ['돕다', '도움', '구조하다', '피하다'],
      'show': ['보여주다', '나타내다', '공연', '증명하다'],
      'hear': ['듣다', '들리다', '소식을 듣다', '청취하다'],
      'turn': ['돌다', '변하다', '차례', '돌리다'],
      'start': ['시작하다', '출발하다', '깜짝 놀라다', '착수하다'],
      'move': ['움직이다', '이사하다', '감동시키다', '제안하다'],
      'live': ['살다', '생활하다', '살아있는', '방송하다'],
      'believe': ['믿다', '생각하다', '신뢰하다', '확신하다'],
      'bring': ['가져오다', '데려오다', '일으키다', '초래하다'],
      'happen': ['일어나다', '발생하다', '우연히 하다', '생기다'],
      'write': ['쓰다', '작성하다', '저술하다', '기록하다'],
      'sit': ['앉다', '위치하다', '개최되다', '맞다'],
      'stand': ['서다', '견디다', '위치', '입장'],
      'lose': ['잃다', '지다', '놓치다', '줄어들다'],
      'pay': ['지불하다', '보상하다', '주의하다', '방문하다'],
      'meet': ['만나다', '마주치다', '충족하다', '모임'],
      'include': ['포함하다', '들어있다', '함께 하다', '계산에 넣다'],
      'continue': ['계속하다', '지속하다', '재개하다', '연장하다'],
      'set': ['놓다', '정하다', '세트', '고정된'],
      'learn': ['배우다', '익히다', '알게 되다', '학습하다'],
      'change': ['바꾸다', '변화', '거스름돈', '갈아입다'],
      'lead': ['이끌다', '지도하다', '납', '앞서다'],
      'understand': ['이해하다', '알다', '파악하다', '동정하다'],
      'watch': ['보다', '지켜보다', '시계', '감시하다'],
      'follow': ['따르다', '뒤따르다', '이해하다', '준수하다'],
      'stop': ['멈추다', '그만두다', '정류장', '막다'],
      'create': ['만들다', '창조하다', '생성하다', '일으키다'],
      'speak': ['말하다', '연설하다', '이야기하다', '표현하다'],
      'read': ['읽다', '해석하다', '공부하다', '나타내다'],
      'spend': ['쓰다', '보내다', '소비하다', '지출하다'],
      'grow': ['자라다', '기르다', '증가하다', '발전하다'],
      'open': ['열다', '열린', '개방하다', '시작하다'],
      'walk': ['걷다', '산책하다', '보행', '안내하다'],
      'win': ['이기다', '승리하다', '얻다', '설득하다'],
      'teach': ['가르치다', '교육하다', '보여주다', '훈련시키다'],
      'offer': ['제공하다', '제안하다', '신청하다', '시도하다'],
      'remember': ['기억하다', '상기하다', '추억하다', '전해주다'],
      'consider': ['고려하다', '생각하다', '여기다', '검토하다'],
      'appear': ['나타나다', '보이다', '출현하다', '공연하다'],
      'buy': ['사다', '구입하다', '믿다', '받아들이다'],
      'serve': ['섬기다', '제공하다', '복무하다', '도움이 되다'],
      'die': ['죽다', '사망하다', '소멸하다', '간절히 원하다'],
      'send': ['보내다', '전송하다', '파견하다', '발송하다'],
      'build': ['짓다', '건설하다', '구축하다', '체격'],
      'stay': ['머물다', '지내다', '유지하다', '견디다'],
      'fall': ['떨어지다', '넘어지다', '가을', '감소하다'],
      'cut': ['자르다', '베다', '줄이다', '상처'],
      'reach': ['도달하다', '닿다', '연락하다', '범위'],
      'kill': ['죽이다', '살해하다', '끄다', '시간을 보내다'],
      'remain': ['남다', '머물다', '유지되다', '계속 있다']
    };
    
    // 입력된 단어가 사전에 있다면 추가 뜻들을 포함
    const lowerText = text.toLowerCase().trim();
    if (additionalMeanings[lowerText]) {
      additionalMeanings[lowerText].forEach(meaning => {
        if (!meanings.some(m => m.includes(meaning))) {
          meanings.push(meaning);
        }
      });
    }
    
    if (meanings.length > 0) {
      // 중복 제거 및 정리
      const uniqueMeanings = [...new Set(meanings)];
      return uniqueMeanings.slice(0, 5); // 최대 5개까지만 반환 (배열로)
    }
    
    return [];
  } catch (error) {
    console.error('번역 오류:', error);
    return ['번역할 수 없습니다. 인터넷 연결을 확인해주세요.'];
  }
};

function App() {
  const [studentName, setStudentName] = useState<string>('');
  const [sections, setSections] = useState<SectionData[]>(
    Array(5).fill(null).map(() => ({ word: '', meaning: '', meanings: [], image: null }))
  );
  const pageRef = useRef<HTMLDivElement>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleWordChange = (index: number, word: string) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], word, meaning: '', meanings: [] };
    setSections(newSections);
  };

  // 한국어인지 영어인지 판단하는 함수
  const isKoreanText = (text: string): boolean => {
    const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
    return koreanRegex.test(text);
  };

  const handleMeaningClick = async (index: number) => {
    const word = sections[index].word;
    if (!word.trim()) return;
    
    try {
      const isKorean = isKoreanText(word);
      const meanings = await translateText(word, isKorean);
      const updatedSections = [...sections];
      updatedSections[index] = { 
        ...updatedSections[index], 
        meanings: Array.isArray(meanings) ? meanings : [meanings],
        meaning: Array.isArray(meanings) ? meanings.join(' / ') : meanings
      };
      setSections(updatedSections);
    } catch (error) {
      const errorSections = [...sections];
      errorSections[index] = { 
        ...errorSections[index], 
        meanings: ['번역 중 오류가 발생했습니다.'],
        meaning: '번역 중 오류가 발생했습니다.' 
      };
      setSections(errorSections);
    }
  };

  const handleSpeak = (text: string, rate: number) => {
    if (!text.trim()) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // 미국 여성 목소리 강제 설정
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.lang.includes('en-US') && 
        (voice.name.toLowerCase().includes('female') || 
         voice.name.toLowerCase().includes('woman') ||
         voice.name.toLowerCase().includes('samantha') || 
         voice.name.toLowerCase().includes('karen') || 
         voice.name.toLowerCase().includes('moira') ||
         voice.name.toLowerCase().includes('susan') ||
         voice.name.toLowerCase().includes('allison'))
      ) || voices.find(voice => 
        voice.lang.includes('en-US') && voice.name.toLowerCase().includes('us')
      ) || voices.find(voice => voice.lang.includes('en-US'));
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
    };
    
    // 음성이 로드되지 않았을 경우를 대비
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', setVoice, { once: true });
    } else {
      setVoice();
    }
    
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = 1.1; // 약간 높은 톤으로 젊은 느낌
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  };

  // 음성 재생을 위한 텍스트 결정 함수
  const getTextForSpeech = (index: number): string => {
    const section = sections[index];
    if (!section.word.trim()) return '';
    
    // 한국어 입력이고 영어 번역 결과가 있으면 영어를 읽기
    if (isKoreanText(section.word) && section.meaning) {
      return section.meaning;
    }
    
    // 영어 입력이면 원본 영어를 읽기
    return section.word;
  };

  const handleImageUpload = (index: number, file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newSections = [...sections];
        newSections[index] = { ...newSections[index], image: e.target?.result as string };
        setSections(newSections);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImagePaste = (index: number, e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          handleImageUpload(index, file);
        }
        break;
      }
    }
  };

  const handleImageDelete = (index: number) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], image: null };
    setSections(newSections);
  };

  const removeMeaning = (sectionIndex: number, meaningIndex: number) => {
    const newSections = [...sections];
    const updatedMeanings = [...newSections[sectionIndex].meanings];
    updatedMeanings.splice(meaningIndex, 1);
    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      meanings: updatedMeanings,
      meaning: updatedMeanings.join(' / ')
    };
    setSections(newSections);
  };

  const handleScreenshot = async () => {
    if (!pageRef.current) return;
    
    try {
      const canvas = await html2canvas(pageRef.current, {
        backgroundColor: '#f0f8ff',
        scale: 2,
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `${studentName ? `${studentName}_` : ''}영어학습_${new Date().toLocaleDateString('ko-KR')}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('스크린샷 저장 중 오류가 발생했습니다:', error);
    }
  };

  // 전역 Ctrl+V 이벤트 리스너 추가
  React.useEffect(() => {
    const handleGlobalPaste = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'v') {
        // 현재 포커스된 섹션 찾기 (간단히 첫 번째 빈 섹션 사용)
        const emptyIndex = sections.findIndex(section => !section.image);
        if (emptyIndex !== -1) {
          // 클립보드에서 이미지 가져오기
          navigator.clipboard.read().then(items => {
            for (const item of items) {
              if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
                item.getType('image/png').then(blob => {
                  const file = new File([blob], 'pasted-image.png', { type: 'image/png' });
                  handleImageUpload(emptyIndex, file);
                }).catch(() => {
                  item.getType('image/jpeg').then(blob => {
                    const file = new File([blob], 'pasted-image.jpg', { type: 'image/jpeg' });
                    handleImageUpload(emptyIndex, file);
                  });
                });
                break;
              }
            }
          }).catch(() => {
            // 클립보드 API가 지원되지 않는 경우 기존 방식 사용
          });
        }
      }
    };

    document.addEventListener('keydown', handleGlobalPaste);
    return () => document.removeEventListener('keydown', handleGlobalPaste);
  }, [sections]);

  const handleReset = () => {
    setSections(Array(5).fill(null).map(() => ({ word: '', meaning: '', meanings: [], image: null })));
    window.speechSynthesis.cancel();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div ref={pageRef} className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-white rounded-xl shadow-md p-4 border-2 border-blue-100">
              <label className="block text-sm font-semibold text-blue-700 mb-2">
                👤 학생 이름
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="px-3 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 transition-colors text-lg font-medium"
              />
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">
                📅 {new Date().toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-blue-600 mb-2">🌟 영어 학습 도우미 🌟</h1>
            <p className="text-lg text-gray-600">
              {studentName ? `${studentName}님, ` : ''}단어를 배우고 이미지와 함께 기억해보세요!
            </p>
          </div>
        </div>

        {/* Learning Sections */}
        <div className="space-y-6 mb-8">
          {sections.map((section, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-blue-600">섹션 {index + 1}</h2>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Side - Word Input and Controls */}
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-blue-700 mb-2">
                      🔤 영어/한국어 단어 또는 문장 입력
                    </label>
                    <input
                      type="text"
                      value={section.word}
                      onChange={(e) => handleWordChange(index, e.target.value)}
                      placeholder="영어나 한국어 단어/문장을 입력하세요"
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg text-lg focus:outline-none focus:border-blue-400 transition-colors"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleMeaningClick(index)}
                      disabled={!section.word.trim()}
                      className="flex-1 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg"
                    >
                      💡 {isKoreanText(section.word) ? '영어로 번역' : '뜻 보기'}
                    </button>
                  </div>

                  {section.meaning && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-green-700 mb-2">
                        📖 {isKoreanText(section.word) ? '영어' : '뜻'}: (클릭하면 제거됩니다)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {section.meanings.map((meaning, meaningIndex) => (
                          <button
                            key={meaningIndex}
                            onClick={() => removeMeaning(index, meaningIndex)}
                            className="bg-green-100 hover:bg-red-100 hover:line-through text-green-800 hover:text-red-800 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 border border-green-300 hover:border-red-300"
                          >
                            {meaning}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-orange-50 rounded-xl p-4">
                    <p className="text-sm font-semibold text-orange-700 mb-3">🎵 듣기 옵션</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSpeak(getTextForSpeech(index), 0.5)}
                        disabled={!getTextForSpeech(index)}
                        className="flex-1 bg-orange-300 hover:bg-orange-400 disabled:bg-gray-300 text-white font-bold py-2 px-3 rounded-lg transition-colors duration-200 text-sm"
                      >
                        🐌 천천히
                      </button>
                      <button
                        onClick={() => handleSpeak(getTextForSpeech(index), 1)}
                        disabled={!getTextForSpeech(index)}
                        className="flex-1 bg-orange-400 hover:bg-orange-500 disabled:bg-gray-300 text-white font-bold py-2 px-3 rounded-lg transition-colors duration-200 text-sm"
                      >
                        🚶 일반
                      </button>
                      <button
                        onClick={() => handleSpeak(getTextForSpeech(index), 1.3)}
                        disabled={!getTextForSpeech(index)}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold py-2 px-3 rounded-lg transition-colors duration-200 text-sm"
                      >
                        🏃 빠르게
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Side - Image Upload */}
                <div className="space-y-4">
                  <div className="bg-purple-50 rounded-xl p-4">
                    <p className="text-sm font-semibold text-purple-700 mb-3">🖼️ 이미지 추가</p>
                    {!section.image ? (
                      <div 
                        className="border-3 border-dashed border-purple-300 rounded-xl p-8 text-center bg-white hover:bg-purple-25 transition-colors cursor-pointer"
                        onPaste={(e) => handleImagePaste(index, e)}
                        onClick={() => fileInputRefs.current[index]?.click()}
                        tabIndex={0}
                      >
                        <Upload className="mx-auto mb-2 text-purple-400" size={32} />
                        <p className="text-purple-600 font-medium">
                          클릭해서 파일 선택하거나<br />
                          Ctrl+V로 이미지를 붙여넣기 하세요
                        </p>
                        <input
                          ref={(el) => fileInputRefs.current[index] = el}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(index, file);
                          }}
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={section.image}
                          alt="업로드된 이미지"
                          className="w-full h-64 object-cover rounded-xl shadow-md"
                        />
                        <button
                          onClick={() => handleImageDelete(index)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Controls */}
        <div className="flex justify-center gap-4 bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-100">
          <button
            onClick={handleScreenshot}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <Download size={20} />
            📸 {studentName ? `${studentName}_` : ''}영어학습 저장
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <RotateCcw size={20} />
            🔄 리셋
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;