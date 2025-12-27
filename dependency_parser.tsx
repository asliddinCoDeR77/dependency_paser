import React, { useState } from 'react';
import { Download, Check, Loader2, Sun, Moon } from 'lucide-react';

const DependencyParser = () => {
  const [inputText, setInputText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [downloaded, setDownloaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const POS_LIST = "NOUN, VERB, ADJ, ADV, PRON, DET, ADP, NUM, CONJ, PART, AUX, INTJ, PROPN, PUNCT";
  const DEPREL_LIST = "root, nsubj, obj, iobj, obl, advmod, amod, det, nummod, nmod, nmod:poss, compound, flat, aux, cop, mark, case, cc, conj, punct, acl, advcl, xcomp, ccomp, discourse, vocative, expl, dislocated, fixed";

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const analyzeText = async () => {
    if (!inputText.trim()) {
      alert('Iltimos, matn kiriting!');
      return;
    }

    setLoading(true);
    setParsedData(null);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: `Sen professional o'zbek tili dependency parser tahlilchisissan. O'zbek tilining grammatik qoidalariga to'liq rioya qilgan holda tahlil qilishing kerak.

GAP: "${inputText}"

Foydalanish kerak bo'lgan POS tag'lar: ${POS_LIST}
Foydalanish kerak bo'lgan Dependency relations: ${DEPREL_LIST}

O'ZBEK TILI DEPENDENCY QOIDALARI:

1. ROOT (kesim) - Gapning asosiy fe'li ROOT bo'ladi (head: 0, deprel: "root")
   - Fe'lni aniqlash: -moq/-mak, -di/-gan/-yotgan/-ayotgan, -adi/-yadi va boshqa fe'l qo'shimchalari

2. NSUBJ (ega) - Harakat bajaruvchi, ROOT (fe'l)ga bog'lanadi
   - Odatda gap boshida keladi
   - Misol: "Men ketdim" → Men (PRON, nsubj) → ketdim (VERB, root)

3. OBJ (to'ldiruvchi) - To'g'ridan-to'g'ri to'ldiruvchi, fe'lga bog'lanadi
   - -ni qo'shimchasi bilan yoki qo'shimchasiz
   - Misol: "Kitobni o'qidim" → Kitobni (NOUN, obj) → o'qidim (VERB, root)

4. OBL (hol) - Payt, joy, sabab va boshqa hollar
   - -da, -dan, -ga qo'shimchalari bilan
   - Misol: "Maktabga bordim" → Maktabga (NOUN, obl) → bordim (VERB, root)

5. NUMMOD - Son va sanalayotgan narsa
   - Son head bo'ladi, ot unga bog'lanadi
   - Misol: "5 baho" → baho (NOUN, nummod) → 5 (NUM, head)

6. AMOD - Sifat va ot
   - Sifat head bo'ladi, ot unga bog'lanadi yoki ot head bo'ladi
   - Misol: "Chiroyli uy" → Chiroyli (ADJ, amod) → uy (NOUN, head)

7. ADVMOD - Ravish va fe'l
   - Ravish fe'lga bog'lanadi
   - Misol: "tez yugurdi" → tez (ADV, advmod) → yugurdi (VERB, root)

8. CASE - Kelishik qo'shimchalari
   - -ga, -da, -dan, -ni, -ning
   - Misol: "uyga" → ga (ADP, case) → uy (NOUN, head)

9. CC va CONJ - Bog'lovchilar va bog'langan so'zlar
   - "va" (CCONJ, cc) ikki so'zni bog'laydi
   - Misol: "olma va nok" → va (CCONJ, cc) → olma (NOUN), nok (NOUN, conj) → olma

MUHIM:
- Har bir so'z faqat BITTA head ga bog'lanishi kerak
- ROOT faqat bitta bo'lishi kerak (gapning asosiy fe'li)
- ID lar 1 dan boshlansin
- Lemma - so'zning asosiy shakli (qo'shimchalarsiz)
- Head - qaysi so'zga bog'langanini aniq belgilang (0 faqat ROOT uchun)

FAQAT JSON array formatida javob ber, boshqa hech narsa yozma:

[
  {"id": 1, "form": "So'z", "lemma": "so'z", "upos": "NOUN", "head": 2, "deprel": "nsubj"},
  {"id": 2, "form": "ketdi", "lemma": "ket", "upos": "VERB", "head": 0, "deprel": "root"}
]`
            }
          ],
        })
      });

      const data = await response.json();
      const content = data.content[0].text;
      
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const tokens = JSON.parse(jsonMatch[0]);
        setParsedData(tokens);
      } else {
        throw new Error("JSON format topilmadi");
      }
    } catch (error) {
      console.error('Tahlil xatosi:', error);
      alert('Tahlil qilishda xato yuz berdi. Iltimos, qayta urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  const downloadTable = () => {
    if (!parsedData) return;
    
    const headers = ['ID', 'Token', 'Lemma', 'Tag', 'Head (Hokim)', 'Deprel (Bog\'lanish)'];
    const rows = parsedData.map(token => [
      token.id,
      token.form,
      token.lemma || token.form,
      token.upos,
      token.head,
      token.deprel
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'dependency_analysis.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const renderDependencyTree = () => {
    if (!parsedData) return null;

    const boxWidth = 120;
    const spacing = 30;
    const totalWidth = Math.max(parsedData.length * (boxWidth + spacing) + 100, 800);
    const svgHeight = 350;
    const tagY = 230;

    return (
      <svg width={totalWidth} height={svgHeight} className="mx-auto">
        {/* Strelkalar */}
        {parsedData.map((token) => {
          const fromIndex = token.id - 1;
          const fromX = fromIndex * (boxWidth + spacing) + 50 + boxWidth / 2;

          if (token.head === 0) {
            const rootY = 60;
            return (
              <g key={`arrow-${token.id}`}>
                <line
                  x1={fromX}
                  y1={tagY}
                  x2={fromX}
                  y2={rootY}
                  className={`${darkMode ? 'stroke-blue-400' : 'stroke-blue-600'} stroke-[2.5]`}
                  markerEnd="url(#arrowhead)"
                />
                <text
                  x={fromX + 12}
                  y={rootY + 15}
                  className={`text-xs font-semibold ${darkMode ? 'fill-blue-400' : 'fill-blue-600'}`}
                >
                  root
                </text>
              </g>
            );
          }

          const toIndex = token.head - 1;
          const toX = toIndex * (boxWidth + spacing) + 50 + boxWidth / 2;
          const dx = toX - fromX;
          const distance = Math.abs(dx);
          const arcHeight = Math.min(distance * 0.5 + 30, 100);

          return (
            <g key={`arrow-${token.id}`}>
              <path
                d={`M ${fromX},${tagY} Q ${fromX + dx / 2},${tagY - arcHeight} ${toX},${tagY}`}
                className={`${darkMode ? 'stroke-blue-400' : 'stroke-blue-600'} fill-none stroke-[2.5]`}
                markerEnd="url(#arrowhead)"
              />
              {/* Deprel text - strelka boshlanish nuqtasiga yaqin */}
              <text
                x={fromX + (dx > 0 ? 15 : -15)}
                y={tagY - 15}
                textAnchor={dx > 0 ? 'start' : 'end'}
                className={`text-xs font-semibold ${darkMode ? 'fill-blue-500' : 'fill-blue-700'}`}
              >
                {token.deprel}
              </text>
            </g>
          );
        })}

        {/* POS Tags va So'zlar */}
        {parsedData.map((token) => {
          const index = token.id - 1;
          const x = index * (boxWidth + spacing) + 50;

          return (
            <g key={token.id}>
              {/* POS Tag */}
              <rect
                x={x + boxWidth / 2 - 35}
                y={tagY}
                width="70"
                height="32"
                className={`${darkMode ? 'fill-blue-600' : 'fill-blue-500'}`}
                rx="16"
              />
              <text
                x={x + boxWidth / 2}
                y={tagY + 21}
                textAnchor="middle"
                className="text-sm font-bold fill-white"
              >
                {token.upos}
              </text>

              {/* So'z */}
              <text
                x={x + boxWidth / 2}
                y={tagY + 55}
                textAnchor="middle"
                className={`text-base font-semibold ${darkMode ? 'fill-gray-100' : 'fill-gray-900'}`}
              >
                {token.form}
              </text>
            </g>
          );
        })}

        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 5, 0 10"
              className={darkMode ? 'fill-blue-400' : 'fill-blue-600'}
            />
          </marker>
        </defs>
      </svg>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-blue-600">Uzbek</span>
            <span className={darkMode ? 'text-teal-400' : 'text-teal-500'}> Dependency Parser</span>
          </h1>
          
          {/* Dark Mode Toggle */}
          <div className="flex items-center gap-3">
            <Sun className={`${darkMode ? 'text-gray-600' : 'text-yellow-500'} transition-colors`} size={18} />
            <button
              onClick={toggleDarkMode}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${darkMode ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
            <Moon className={`${darkMode ? 'text-blue-400' : 'text-gray-400'} transition-colors`} size={18} />
          </div>
        </div>

        {/* Asl Matn */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6`}>
          <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            ASL MATN
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className={`w-full h-24 p-4 rounded-lg border-2 resize-none ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            } focus:outline-none focus:border-blue-500`}
            placeholder="Men maktabga borib 5 baho oldim"
            disabled={loading}
          />
          <button
            onClick={analyzeText}
            disabled={loading}
            className="mt-4 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                TAHLIL QILINMOQDA...
              </>
            ) : (
              <>
                ✨ TAHLIL QILISH
              </>
            )}
          </button>
        </div>

        {/* Matn Tahlili */}
        {parsedData && (
          <>
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6`}>
              <h2 className={`text-sm font-semibold mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                MATN TAHLILI (SINTAKTIK GRAF)
              </h2>
              <div className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg p-6 overflow-x-auto`}>
                {renderDependencyTree()}
              </div>
            </div>

            {/* Lingvistik Ko'rinish */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  LINGVISTIK KO'RINISH
                </h2>
                <button
                  onClick={downloadTable}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  {downloaded ? <Check size={16} /> : <Download size={16} />}
                  {downloaded ? 'Yuklandi' : 'Yuklash'}
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className={darkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                      <th className={`border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} px-4 py-2 text-sm font-semibold text-left`}>ID</th>
                      <th className={`border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} px-4 py-2 text-sm font-semibold text-left`}>Token</th>
                      <th className={`border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} px-4 py-2 text-sm font-semibold text-left`}>Lemma</th>
                      <th className={`border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} px-4 py-2 text-sm font-semibold text-left`}>Tag</th>
                      <th className={`border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} px-4 py-2 text-sm font-semibold text-left`}>Head (Hokim)</th>
                      <th className={`border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} px-4 py-2 text-sm font-semibold text-left`}>Deprel (Bog'lanish)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((token) => (
                      <tr key={token.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className={`border ${darkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-600'} px-4 py-2 text-sm`}>{token.id}</td>
                        <td className={`border ${darkMode ? 'border-gray-600 text-white' : 'border-gray-300 text-gray-900'} px-4 py-2 text-sm font-semibold`}>{token.form}</td>
                        <td className={`border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} px-4 py-2 text-sm`}>{token.lemma || token.form}</td>
                        <td className={`border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} px-4 py-2 text-sm`}>{token.upos}</td>
                        <td className={`border ${darkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-600'} px-4 py-2 text-sm text-center`}>{token.head}</td>
                        <td className={`border ${darkMode ? 'border-gray-600 text-blue-400' : 'border-gray-300 text-blue-600'} px-4 py-2 text-sm font-semibold`}>{token.deprel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DependencyParser;