import React, { useState, useRef } from 'react';
import { Volume2, VolumeX, Download, RotateCcw, Upload, Trash2 } from 'lucide-react';
import html2canvas from 'html2canvas';

// 축하 효과 컴포넌트
const CelebrationEffect: React.FC<{ show: boolean; onComplete: () => void }> = ({ show, onComplete }) => {
  React.useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black bg-opacity-20 animate-pulse" />
      
      {/* 중앙 축하 메시지 */}
      <div className="relative z-10 text-center animate-bounce">
        <div className="text-6xl mb-4 animate-spin">🎉</div>
        <div className="text-4xl font-bold text-yellow-400 drop-shadow-lg animate-pulse">
          잘했어요!
        </div>
        <div className="text-2xl text-white drop-shadow-lg mt-2">
          Great Job! 🌟
        </div>
      </div>
      
      {/* 떨어지는 이모지들 */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute text-4xl animate-bounce"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${1 + Math.random() * 2}s`
          }}
        >
          {['⭐', '🎊', '🎈', '🌟', '✨', '🎁', '🏆', '👏'][Math.floor(Math.random() * 8)]}
        </div>
      ))}
      
      {/* 원형 파동 효과 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-32 h-32 border-4 border-yellow-400 rounded-full animate-ping opacity-75" />
        <div className="absolute w-48 h-48 border-4 border-blue-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '0.5s' }} />
        <div className="absolute w-64 h-64 border-4 border-green-400 rounded-full animate-ping opacity-25" style={{ animationDelay: '1s' }} />
      </div>
    </div>
  );
};

interface SectionData {
  word: string;
  meaning: string;
  meanings: string[];
  image: string | null;
  description: string;
}

// 실제 번역 API 함수
const translateText = async (text: string, isKorean: boolean = false): Promise<string | string[]> => {
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
    Array(5).fill(null).map(() => ({ word: '', meaning: '', meanings: [], image: null, description: '' }))
  );
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 붙여넣기 이벤트 처리
  React.useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (activeSection !== null) {
        const items = e.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
              e.preventDefault();
              const file = items[i].getAsFile();
              if (file) {
                handleImageUpload(activeSection, file);
              }
              break;
            }
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [activeSection]);

  // 섹션 클릭 핸들러
  const handleSectionClick = (index: number) => {
    setActiveSection(index);
    // 섹션에 포커스 주기
    if (sectionRefs.current[index]) {
      sectionRefs.current[index]?.focus();
    }
  };

  // 음성 읽기 기능
  const speakText = (text: string, rate: number = 1) => {
    if (!text.trim()) return;
    
    // 기존 음성 중지
    window.speechSynthesis.cancel();
    
    // 음성 목록 로드 대기
    const loadVoices = () => {
      return new Promise<SpeechSynthesisVoice[]>((resolve) => {
        let voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          resolve(voices);
        } else {
          window.speechSynthesis.onvoiceschanged = () => {
            voices = window.speechSynthesis.getVoices();
            resolve(voices);
          };
        }
      });
    };

    loadVoices().then((voices) => {
      let selectedVoice = null;
      
      // 젊은 미국 여성 목소리 우선순위로 찾기
      const preferredVoices = [
        'Microsoft Aria Online (Natural) - English (United States)',
        'Microsoft Jenny Online (Natural) - English (United States)',
        'Microsoft Emma Online (Natural) - English (United States)',
        'Microsoft Olivia Online (Natural) - English (United States)',
        'Microsoft Ava Online (Natural) - English (United States)',
        'Google US English Female',
        'Samantha',
        'Allison',
        'Ava',
        'Emma',
        'Olivia',
        'Zoe',
        'Chloe'
      ];
      
      // 우선순위 목록에서 찾기
      for (const preferred of preferredVoices) {
        selectedVoice = voices.find(voice => 
          voice.name.includes(preferred) || voice.name === preferred
        );
        if (selectedVoice) break;
      }
      
      // 젊은 여성 목소리 키워드로 찾기
      if (!selectedVoice) {
        const youngFemaleKeywords = ['aria', 'jenny', 'emma', 'olivia', 'ava', 'zoe', 'chloe', 'allison', 'natural', 'neural', 'female', 'woman', 'girl'];
        selectedVoice = voices.find(voice => 
          voice.lang.includes('en-US') && 
          youngFemaleKeywords.some(keyword => 
            voice.name.toLowerCase().includes(keyword)
          )
        );
      }
      
      // 미국 영어 여성 목소리 찾기
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.lang.includes('en-US') && 
          (voice.name.toLowerCase().includes('female') || 
           voice.name.toLowerCase().includes('woman'))
        );
      }
      
      // 미국 영어 목소리 중 아무거나
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.startsWith('en-US'));
      }
      
      // 영어 목소리 중 아무거나
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = rate;
      utterance.pitch = 1.2; // 더 높은 톤으로 20대 젊은 여성 느낌
      utterance.volume = 1.0;
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('선택된 음성:', selectedVoice.name); // 디버깅용
      }
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    });
  };
    

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

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
    e.preventDefault();
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

  const handleDescriptionChange = (index: number, description: string) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], description };
    setSections(newSections);
  };

  const handleScreenshot = async () => {
    if (!pageRef.current) return;
    
    setIsCapturing(true);
    
    // 잠시 기다려서 버튼들이 숨겨지도록 함
    await new Promise(resolve => setTimeout(resolve, 100));
    
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
    } finally {
      setIsCapturing(false);
    }
  };

  const handleReset = () => {
    setSections(Array(5).fill(null).map(() => ({ word: '', meaning: '', meanings: [], image: null, description: '' })));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <CelebrationEffect 
        show={showCelebration} 
        onComplete={() => setShowCelebration(false)} 
      />
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
            <div 
              key={index} 
              ref={(el) => sectionRefs.current[index] = el}
              className={`bg-white rounded-2xl shadow-lg p-6 border-2 transition-all duration-200 cursor-pointer ${
                activeSection === index 
                  ? 'border-blue-500 shadow-xl ring-2 ring-blue-200' 
                  : 'border-blue-100 hover:border-blue-300'
              }`}
              onClick={() => handleSectionClick(index)}
              tabIndex={0}
              onFocus={() => setActiveSection(index)}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-blue-600">
                  {activeSection === index && '📌 '}섹션 {index + 1}
                  {activeSection === index && ' (활성화됨)'}
                </h2>
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
                      onClick={(e) => e.stopPropagation()}
                      placeholder="영어나 한국어 단어/문장을 입력하세요"
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg text-lg focus:outline-none focus:border-blue-400 transition-colors"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleMeaningClick(index)}
                      disabled={!section.word.trim()}
                      className={`flex-1 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg ${isCapturing ? 'hidden' : ''}`}
                    >
                      💡 {isKoreanText(section.word) ? '영어로 번역' : '뜻 보기'}
                    </button>
                  </div>

                  {/* 영어 읽기 버튼들 */}
                  {section.word && !isKoreanText(section.word) && (
                    <div className={`bg-blue-50 border-2 border-blue-200 rounded-xl p-4 ${isCapturing ? 'hidden' : ''}`}>
                      <p className="text-sm font-semibold text-blue-700 mb-3">🔊 영어 듣기</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => speakText(section.word, 0.7)}
                          disabled={isSpeaking}
                          className="flex-1 bg-blue-400 hover:bg-blue-500 disabled:bg-gray-400 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                        >
                          🐌 천천히
                        </button>
                        <button
                          onClick={() => speakText(section.word, 1)}
                          disabled={isSpeaking}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                        >
                          🗣️ 일반
                        </button>
                        <button
                          onClick={() => speakText(section.word, 1.3)}
                          disabled={isSpeaking}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                        >
                          🚀 빠르게
                        </button>
                        {isSpeaking && (
                          <button
                            onClick={stopSpeaking}
                            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                          >
                            <VolumeX size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {section.meaning && (
                    <div className={`bg-green-50 border-2 border-green-200 rounded-xl p-4 ${isCapturing ? 'pb-2' : ''}`}>
                      <p className="text-sm font-semibold text-green-700 mb-2">
                        📖 {isKoreanText(section.word) ? '영어' : '뜻'}: {!isCapturing && '(클릭하면 제거됩니다)'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {section.meanings.map((meaning, meaningIndex) => (
                          <div
                            key={meaningIndex}
                            onClick={!isCapturing ? () => removeMeaning(index, meaningIndex) : undefined}
                            className={`bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-medium border border-green-300 ${!isCapturing ? 'hover:bg-red-100 hover:line-through hover:text-red-800 hover:border-red-300 cursor-pointer transition-all duration-200' : ''}`}
                          >
                            {meaning}
                          </div>
                        ))}
                      </div>
                      {!isCapturing && (
                        <div className="mt-3">
                          <input
                            type="text"
                            placeholder="추가 뜻을 직접 입력하세요"
                            className="w-full px-3 py-2 border-2 border-green-200 rounded-lg text-sm focus:outline-none focus:border-green-400 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const input = e.target as HTMLInputElement;
                                const newMeaning = input.value.trim();
                                if (newMeaning && !section.meanings.includes(newMeaning)) {
                                  const updatedSections = [...sections];
                                  updatedSections[index] = {
                                    ...updatedSections[index],
                                    meanings: [...updatedSections[index].meanings, newMeaning],
                                    meaning: [...updatedSections[index].meanings, newMeaning].join(' / ')
                                  };
                                  setSections(updatedSections);
                                  input.value = '';
                                }
                              }
                            }}
                          />
                          <p className="text-xs text-green-600 mt-1">Enter를 눌러서 뜻을 추가하세요</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Side - Image Upload */}
                <div className="space-y-4">
                  {section.image === null ? (
                    <div
                      className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer"
                      onClick={() => !isCapturing && fileInputRefs.current[index]?.click()}
                      onPaste={(e) => handleImagePaste(index, e)}
                    >
                      <div className="flex flex-col items-center">
                        <Upload className="mx-auto mb-2 text-purple-400" size={32} />
                        <p className="text-purple-600 font-medium">
                          {!isCapturing ? (
                            <>
                              파일 선택하거나<br />
                              섹션 클릭 후 Ctrl+V로 붙여넣기
                            </>
                          ) : (
                            '이미지 영역'
                          )}
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
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={section.image}
                        alt="업로드된 이미지"
                        className="w-full h-64 object-cover rounded-xl shadow-md"
                      />
                      {!isCapturing && (
                        <button
                          onClick={() => handleImageDelete(index)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* 이미지 설명 입력란 */}
                  <div className="bg-yellow-50 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-yellow-700 mb-2">
                      📝 메모
                    </label>
                    <textarea
                      value={section.description}
                      onChange={(e) => handleDescriptionChange(index, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="이미지에 대한 설명이나 학습 포인트를 적어주세요"
                      className="w-full px-3 py-2 border-2 border-yellow-200 rounded-lg text-sm focus:outline-none focus:border-yellow-400 transition-colors resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Controls */}
        <div className={`space-y-6 ${isCapturing ? 'hidden' : ''}`}>
          {/* 저장/리셋 버튼들 */}
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
    </div>
  );
}

export default App;
