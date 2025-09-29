// /app/api/gpt-story/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  // messages: [{ sender: 'bot' | 'user', text: string }...]
  // style: '진중한' | '낭만적인' | '재치있는' | '신비로운'
  const { messages = [], style } = await req.json();

  // 분위기별 톤 가이드(선택 사항: 모델이 톤을 더 잘 따라오도록 도와줍니다)
  const toneMap = {
    '진중한': '차분하고 깊이 있는 어조, 과장 없이 담백하게.',
    '낭만적인': '따뜻하고 서정적인 어조, 부드러운 감수성.',
    '재치있는': '위트 있고 가볍게, 다만 진정성은 유지.',
    '신비로운': '몽환적이고 은유적인 표현, 과장 없이 절제.'
  };
  const selectedTone = style && toneMap[style] ? toneMap[style] : null;

  const systemPrompt = `
당신은 GPT 대화를 기반으로 한 사용자의 '생애문'(life story essay)을 작성하는 작가입니다.
${selectedTone ? `선택된 분위기: "${style}" (${selectedTone})` : ''}

다음 기준에 맞춰 사용자 생애문을 구성하십시오:
1. 문체는 감성적이되 과장되지 않고 사실 기반이어야 합니다.
2. 내용은 시간 순으로 서술하되, 중심 주제나 사람, 사건이 부각되도록 구성합니다.
3. 불완전한 답변은 유추하지 말고, 가능한 정보 내에서 자연스럽게 연결합니다.
4. 다음 요소들을 반드시 반영하도록 시도하십시오:
   - 성장 환경과 배경
   - 특별한 기억 또는 사건
   - 가족, 친구, 소중한 인물들과의 관계
   - 좋아했던 일, 자주 했던 일, 특징적 성격
   - 삶에 대한 태도나 철학

출력은 300자 이내로 구성하며, 마치 인물 소개서 또는 추모문처럼 진정성을 담아 정돈된 문장으로 작성하십시오.
`.trim();

  // 대화 메시지를 OpenAI 포맷으로 변환
  const openAiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.sender === 'bot' ? 'assistant' : 'user',
      content: m.text,
    })),
  ];

  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: openAiMessages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[GPT-STORY ERROR]', errorText);
    return NextResponse.json({ error: errorText }, { status: 500 });
  }

  const data = await response.json();
  const story = data.choices?.[0]?.message?.content ?? '';
  return NextResponse.json({ story });
}
