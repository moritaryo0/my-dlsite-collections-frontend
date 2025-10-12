import { useEffect, useState } from 'react';

type OptionKey = 'A' | 'B' | 'C'
type QuizItem = {
  id: number
  question: string
  options: { A: string; B: string; C: string }
  answer: OptionKey
  note?: string
}
type QuizItemWithOrder = QuizItem & { optionsOrder: OptionKey[] }

// --- クイズのデータ ---
const quizData: QuizItem[] = [
    {
        id: 1,
        question: "妖怪ウォッチ2のダウンロード特典のうち「元祖」はどれか",
        options: { A: "ロボニャンF型", B: "セーラーニャン", C: "マスクドニャーン" },
        answer: "A",
        note: "ちなみに「本家」の特典はセーラーニャン、「真打」の特典はマスクドニャーンでした。"
    },
    {
        id: 2,
        question: "アニメ「涼宮ハルヒの憂鬱」でエンドレスエイトは8回連続で放送されたが、エンドレスエイトは夏休みのうちのどの期間が繰り返されていたか。",
        options: { A: "8月の1ヶ月", B: "8月の最後の2週間", C: "8月の最後の1週間" },
        answer: "B",
        note: "2009年6月から8週にわたり、ほぼ同じ内容（演出や作画、声優の演技は毎回異なる）が放送され、視聴者を驚かせました。"
    },
    {
        id: 3,
        question: "アニメ「涼宮ハルヒの憂鬱」で長門有希がエンドレスエイトをループした回数は",
        options: { A: "12500回", B: "15532回", C: "9855回" },
        answer: "B",
        note: "ちなみに原作小説では15498回です。時間に換算すると約594年にもなります。"
    },
    {
        id: 4,
        question: "アニメ「コードギアス 反逆のルルーシュ」に登場するブリタニア皇帝は誰か",
        options: { A: "シャルル・ジ・ブリタニア", B: "シュナイゼル・エル・ブリタニア", C: "ルルーシュ・ヴィ・ブリタニア" },
        answer: "A",
        note: "主人公ルルーシュの実の父親であり、神聖ブリタニア帝国第98代皇帝です。"
    },
    {
        id: 5,
        question: "2007年12月7日にニコニコ動画で公開され、多くの歌ってみた動画が投稿されるなど、その後のボーカロイドシーンを築き上げる火付け役となった初音ミク楽曲は",
        options: { A: "メルト", B: "脳漿炸裂ガール", C: "マトリョシカ" },
        answer: "A",
        note: "作者はsupercellのryo。この曲のヒットが、ボカロ文化の大きな転換点となりました。"
    },
    {
        id: 6,
        question: "YouTubeで現在まで広く使用される、無音や意味のない間を全て切り落として意味のある箇所だけ繋ぎ合わせる手法を提案した黎明期のYouTubeクリエイターは",
        options: { A: "メグウィン", B: "ヒカキン", C: "ジェットダイスケ" },
        answer: "C",
        note: "この編集手法は「ジェットカット」とも呼ばれ、多くのYouTuberに影響を与えました。"
    },
    {
        id: 7,
        question: "らき☆すたの聖地は何県か",
        options: { A: "埼玉県", B: "兵庫県", C: "岐阜県" },
        answer: "A",
        note: "埼玉県鷲宮町（現・久喜市）にある鷲宮神社が、作中に登場する神社のモデルとなっています。"
    },
    {
        id: 8,
        question: "アニメ「プリパラ」に登場するそらみスマイルのスカウトマスコットはクマであるが、ライバルのドレッシングパフェのマスコットはどの動物であるか",
        options: { A: "ネコ", B: "ウサギ", C: "犬" },
        answer: "B",
        note: "ドレッシングパフェのマスコットの名前は「ウサギ」。クマとウサギは犬猿の仲（作中設定）です。"
    },
    {
        id: 9,
        question: "「干物妹！うまるちゃん」に登場する、うまるの友達・海老名菜々の出身地はどこか",
        options: { A: "熊本", B: "秋田", C: "北海道" },
        answer: "B",
        note: "秋田出身の色白でスタイル抜群な女の子で、緊張すると秋田弁が出ます。"
    },
    {
        id: 10,
        question: "「DEATH NOTE」のニア編に登場するSPKのメンバーでないものはどれか",
        options: { A: "ジョン・マッケンロー", B: "ハル・リドナー", C: "アンソニー・レスター" },
        answer: "A",
        note: "ジョン・マッケンローは実在する伝説的なプロテニス選手です。"
    },
    {
        id: 11,
        question: "アニメ「けいおん！」に登場する秋山澪の担当楽器は？",
        options: { A: "ギター", B: "ベース", C: "ドラム" },
        answer: "B",
        note: "担当はベースで、バンドの作詞も手がけています。ちなみに左利きです。"
    },
    {
        id: 12,
        question: "アニメ「魔法少女まどか☆マギカ」で、キュゥべえが魔法少女たちから集めようとしていたものは何か？",
        options: { A: "夢と希望", B: "ソウルジェムの輝き", C: "絶望から魔女に変わる際のエネルギー" },
        answer: "C",
        note: "「僕と契約して、魔法少女になってよ！」というセリフが有名ですね。"
    },
    {
        id: 13,
        question: "「ポケットモンスター ダイヤモンド・パール」におけるシンオウ地方のチャンピオンは誰か？",
        options: { A: "ダイゴ", B: "シロナ", C: "ワタル" },
        answer: "B",
        note: "考古学者でもあり、切り札のガブリアスは多くのプレイヤーを苦しめました。"
    },
    {
        id: 14,
        question: "漫画「進撃の巨人」で、人類が暮らす三重の壁のうち、一番外側にある壁の名前は？",
        options: { A: "ウォール・マリア", B: "ウォール・ローゼ", C: "ウォール・シーナ" },
        answer: "A",
        note: "内側から「ウォール・シーナ」「ウォール・ローゼ」「ウォール・マリア」の順です。"
    },
    {
        id: 15,
        question: "アニメ「とらドラ！」のヒロイン、逢坂大河のあだ名は？",
        options: { A: "猛犬", B: "手乗りタイガー", C: "電撃少女" },
        answer: "B",
        note: "小柄ながら凶暴な性格から、その名が付けられました。"
    },
    {
        id: 16,
        question: "ライトノベル「ソードアート・オンライン」のアインクラッド編で、茅場晶彦が扮していた最強ギルド「血盟騎士団」の団長の名前は？",
        options: { A: "ディアベル", B: "ヒースクリフ", C: "クラディール" },
        answer: "B",
        note: "その正体は、SAOのゲームマスターであり、アインクラッド第100層のボスでもあります。"
    },
    {
        id: 17,
        question: "2000年代にゲームセンターで人気を博した、クイズに答えて魔法で戦うオンライン対戦ゲームのタイトルは？",
        options: { A: "アンサードリーム", B: "クイズマジックアカデミー", C: "クイズRPG 魔法使いと黒猫のウィズ" },
        answer: "B",
        note: "通称「QMA」。ちなみに「黒猫のウィズ」は2013年にリリースされたスマホアプリです。"
    },
    {
        id: 18,
        question: "「ひぐらしのなく頃に」の舞台である雛見沢村で、毎年6月に行われるお祭りの名前は？",
        options: { A: "流し雛祭り", B: "綿流し祭", C: "神迎えの儀" },
        answer: "B",
        note: "村の守り神である「オヤシロさま」に感謝を捧げるお祭りです。"
    },
    {
        id: 19,
        question: "鏡音リンの代表曲の一つで、2008年に投稿され「VOCALOID-PV」タグで初のミリオン再生を達成した楽曲は？",
        options: { A: "炉心融解", B: "右肩の蝶", C: "ココロ" },
        answer: "A",
        note: "作者はiroha(sasaki)。歌詞の暗喩的な表現が多くの解釈を呼びました。"
    },
    {
        id: 20,
        question: "2008年にヒットした、クイズ番組「ヘキサゴンII」から生まれた男性3人組ユニット「羞恥心」のメンバーでないのは誰か？",
        options: { A: "つるの剛士", B: "上地雄輔", C: "田中卓志" },
        answer: "C",
        note: "メンバーは、つるの剛士（羞）、野久保直樹（恥）、上地雄輔（心）の3人。田中卓志はアンガールズのメンバーです。"
    },
    {
        id: 21,
        question: "アニメ「あの日見た花の名前を僕達はまだ知らない。」のヒロイン・本間芽衣子のあだ名は？",
        options: { A: "めんま", B: "あなる", C: "つるこ" },
        answer: "A",
        note: "他の選択肢「あなる（安城鳴子）」「つるこ（鶴見知利子）」も作中に登場するキャラクターのあだ名です。"
    },
    {
        id: 22,
        question: "アニメ「化物語」で、主人公の阿良々木暦を助けるヒロイン・戦場ヶ原ひたぎが武器としてよく使う文房具は？",
        options: { A: "カッターナイフ", B: "コンパス", C: "ホッチキス" },
        answer: "C",
        note: "彼女の舌鋒とともに、物理的な攻撃手段として様々な文房具が使われます。"
    },
    {
        id: 23,
        question: "ニンテンドーDS用ソフト「レイトン教授」シリーズで、レイトンの助手（自称一番弟子）を務める少年の名前は？",
        options: { A: "チェルミー", B: "ルーク", C: "ドン・ポール" },
        answer: "B",
        note: "フルネームは「ルーク・トライトン」。動物と話せる特技を持っています。"
    },
    {
        id: 24,
        question: "アニメ「Angel Beats!」の舞台である死後の世界の学園で、ゆりっぺがリーダーを務める組織の名前は？",
        options: { A: "死んだ世界戦線", B: "SOS団", C: "Little Busters!" },
        answer: "A",
        note: "略称は「SSS」。理不尽な人生を強いた神に反抗するために結成されました。"
    },
    {
        id: 25,
        question: "GREEで提供されていた、自分の分身を育てる育成シミュレーションゲームの名前は？",
        options: { A: "ハコニワ", B: "モンプラ", C: "クリノッペ" },
        answer: "C",
        note: "手のひらサイズのペットのような生き物「クリノッペ」を育てるゲームでした。"
    },
    {
        id: 26,
        question: "Wii Sportsのボクシングで、チャンピオンとして登場する非常に強いMiiの名前は？",
        options: { A: "マット", B: "アキラ", C: "ライアン" },
        answer: "A",
        note: "その圧倒的な強さから、海外ではミーム（ネット上のネタ）としても有名になりました。"
    },
    {
        id: 27,
        question: "「イナズマイレブン」で、雷門中サッカー部の最初の必殺技は何？",
        options: { A: "ゴッドハンド", B: "ファイアトルネード", C: "ドラゴンクラッシュ" },
        answer: "A",
        note: "主人公でキャプテンの円堂守が使う、伝説のキーパー技です。"
    },
    {
        id: 28,
        question: "アニメ「デュラララ!!」で、池袋を拠点に活動する、首の無いライダーの正体（デュラハン）の名前は？",
        options: { A: "ヴァローナ", B: "セルティ・ストゥルルソン", C: "岸谷新羅" },
        answer: "B",
        note: "失くした自分の頭を探して、池袋の街をバイクで駆け巡っています。"
    },
    {
        id: 29,
        question: "2009年に公開され大ヒットした、新垣結衣主演の「ケータイ小説」を原作とした映画は？",
        options: { A: "恋空", B: "赤い糸", C: "君に届け" },
        answer: "A",
        note: "女子中高生を中心に社会現象を巻き起こした「ケータイ小説」ブームの代表作です。"
    },
    {
        id: 30,
        question: "アニメ「ギルティクラウン」で、主人公の桜満集が手にする「王の能力」とは、人の心から何を取り出す能力？",
        options: { A: "記憶", B: "ヴォイド", C: "罪" },
        answer: "B",
        note: "ヴォイドは、その人のコンプレックスや個性を反映した形となって現れます。"
    },
    {
        id: 31,
        question: "アニメ「STEINS;GATE」で、主人公の岡部倫太郎が自称する名前は？",
        options: { A: "鳳凰院凶真", B: "シャイニング・フィンガー", C: "ゼロ" },
        answer: "A",
        note: "読みは「ほうおういん きょうま」。狂気のマッドサイエンティストを演じています。"
    },
    {
        id: 32,
        question: "アニメ「TIGER & BUNNY」で、虎徹とバーナビーのコンビが乗るバイクの名前は？",
        options: { A: "ダブルチェイサー", B: "ブルーローズ", C: "ロンリーチェイサー" },
        answer: "A",
        note: "サイドカー付きのバイクで、状況に応じて虎徹とバーナビーそれぞれのバイクに分離できます。"
    },
    {
        id: 33,
        question: "「モンスターハンターポータブル 2nd G」で、多くのハンターが最初に苦戦したであろう「先生」とも呼ばれるモンスターは？",
        options: { A: "ドスファンゴ", B: "イャンクック", C: "ティガレックス" },
        answer: "B",
        note: "その動きから狩りの基本を学べるため、親しみを込めて「クック先生」と呼ばれています。"
    },
    {
        id: 34,
        question: "「家庭教師ヒットマンREBORN!」で、主人公・ツナが死ぬ気で頑張る時に頭に灯る炎の名前は？",
        options: { A: "死ぬ気の炎", B: "ボンゴレの炎", C: "大空の炎" },
        answer: "A",
        note: "家庭教師のリボーンが撃つ「死ぬ気弾」によって灯されます。"
    },
    {
        id: 35,
        question: "動画サイト「ニコニコ動画」の代名詞でもある、画面上にコメントが流れるシステムのことを何と呼ぶ？",
        options: { A: "字幕", B: "弾幕", C: "テロップ" },
        answer: "B",
        note: "コメントが画面を覆いつくすほどの状態を、シューティングゲームの弾幕になぞらえて「弾幕」と呼びます。"
    },
    {
        id: 36,
        question: "アニメ「マクロスF」に登場する二人の歌姫の名前は、シェリル・ノームと誰？",
        options: { A: "リン・ミンメイ", B: "ランカ・リー", C: "ミレーヌ・ジーナス" },
        answer: "B",
        note: "ランカ・リーの決め台詞「キラッ☆」とそれに伴うポーズが有名です。"
    },
    {
        id: 37,
        question: "KONAMIから発売され「国民の彼女」とも呼ばれたニンテンドーDSの恋愛シミュレーションゲームは？",
        options: { A: "ときめきメモリアル Girl's Side", B: "ラブプラス", C: "ドリームクラブ" },
        answer: "B",
        note: "ゲーム内の時間と現実の時間がリンクしており、リアルな恋愛体験が話題となりました。"
    },
    {
        id: 38,
        question: "「仮面ライダー電王」で、主人公・野上良太郎にイマジンが憑依した時の決め台詞は？",
        options: { A: "さあ、お前の罪を数えろ！", B: "俺、参上！", C: "宇宙キターーー！" },
        answer: "B",
        note: "これは、最初に憑依したイマジン「モモタロス」の決め台詞です。"
    },
    {
        id: 39,
        question: "初音ミクがネギを持っている姿が有名ですが、これはある楽曲の空耳がきっかけです。その元となったフィンランドの民謡は何？",
        options: { A: "ポルカ", B: "マズルカ", C: "イエヴァン・ポルッカ" },
        answer: "C",
        note: "この曲を初音ミクがカバーした動画で、ネギを振るデフォルメキャラクター「はちゅねミク」が登場したことから定着しました。"
    },
    {
        id: 40,
        question: "Mobageで配信され社会現象にもなった、怪盗団を結成して他プレイヤーのお宝を奪い合うソーシャルゲームの名前は？",
        options: { A: "探検ドリランド", B: "怪盗ロワイヤル", C: "釣り★スタ" },
        answer: "B",
        note: "「ポチポチゲー」とも呼ばれる、シンプルな操作性のソーシャルゲームの草分け的存在です。"
    }
];

// --- Fisher-Yates shuffle algorithm ---
function shuffleArray<T>(array: T[]): T[] {
    let currentIndex = array.length, randomIndex;
    const newArray = [...array];
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [newArray[currentIndex], newArray[randomIndex]] = [
            newArray[randomIndex], newArray[currentIndex]];
    }
    return newArray;
}


export default function AgeQuiz() {
    const [questions, setQuestions] = useState<QuizItemWithOrder[]>([]);
    const [pool, setPool] = useState<QuizItem[]>(quizData);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<OptionKey | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [quizStarted, setQuizStarted] = useState(false);

    // Load extra quiz items from public JSON (optional)
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/age-quiz-extra.json', { cache: 'no-store' })
                if (!res.ok) return
                const data: any = await res.json()
                if (!Array.isArray(data)) return
                // Basic validation and ID reindexing to avoid collisions
                const maxId = quizData.reduce((m, q) => Math.max(m, q.id), 0)
                let nextId = maxId + 1
                const normalized: QuizItem[] = data
                  .filter((x: any) => x && typeof x === 'object')
                  .map((x: any) => ({
                    id: nextId++,
                    question: String(x.question ?? ''),
                    options: {
                      A: String(x?.options?.A ?? ''),
                      B: String(x?.options?.B ?? ''),
                      C: String(x?.options?.C ?? ''),
                    },
                    answer: (['A','B','C'].includes(x?.answer) ? x.answer : 'A') as OptionKey,
                    note: x?.note ? String(x.note) : undefined,
                  }))
                  .filter((x: QuizItem) => x.question && x.options.A && x.options.B && x.options.C)
                setPool([...quizData, ...normalized])
            } catch {
                // ignore fetch/parse errors
            }
        })()
    }, [])

    // Function to start or restart the quiz
    const startQuiz = () => {
        const picked = shuffleArray(pool)
          .slice(0, 20)
          .map(q => ({ ...q, optionsOrder: shuffleArray<OptionKey>(['A', 'B', 'C']) }))
        setQuestions(picked);
        setCurrentQuestionIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setShowResult(false);
        setQuizStarted(true);
    };

    // Handler for selecting an answer
    const handleSelectAnswer = (answer: OptionKey) => {
        if (!isAnswered) {
            setSelectedAnswer(answer);
        }
    };

    // Handler for submitting an answer
    const handleSubmit = () => {
        if (selectedAnswer === null) return;

        setIsAnswered(true);
        if (selectedAnswer === questions[currentQuestionIndex].answer) {
            setScore(prevScore => prevScore + 1);
        }
    };

    // Handler for moving to the next question
    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
            setSelectedAnswer(null);
            setIsAnswered(false);
        } else {
            setShowResult(true);
        }
    };

    // Function to determine button color based on its state
    const getButtonClass = (optionKey: OptionKey) => {
        if (!isAnswered) {
            return selectedAnswer === optionKey 
                ? 'bg-blue-600 text-white' 
                : 'bg-black text-white hover:bg-gray-900';
        }

        const currentAnswer = questions[currentQuestionIndex].answer;
        if (optionKey === currentAnswer) {
            return 'bg-green-600 text-white';
        }
        if (optionKey === selectedAnswer && selectedAnswer !== currentAnswer) {
            return 'bg-red-600 text-white';
        }
        return 'bg-black text-gray-300 opacity-80';
    };
    
    // --- Render logic ---

    if (!quizStarted) {
        return (
             <div className="bg-gray-900 min-h-screen flex items-center justify-center font-sans text-white p-4">
                <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-cyan-400 mb-4">
                        知識ベース年齢認証
                    </h1>
                    <p className="text-gray-300 mb-8">
                        特定の年代に流行した知識を問うことで、あなたの年齢を確認します。<br/>
                        20問中14問以上の正解で認証成功です。
                        <br/>AIで問題を生成したので間違ってたらスマソ
                        <br />自分で解けば間違ってないかわかるのだけど、
                        <br />用意した問題が全100問くらいあって正直俺もわからん
                    </p>
                    <button
                        onClick={startQuiz}
                        className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105"
                    >
                        認証を開始する
                    </button>
                </div>
            </div>
        )
    }

    if (showResult) {
        const isPassed = score >= 14;
        return (
            <div className="bg-gray-900 min-h-screen flex items-center justify-center font-sans text-white p-4">
                <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
                    <h2 className="text-3xl font-bold mb-4">認証結果</h2>
                    <p className={`text-5xl font-bold mb-4 ${isPassed ? 'text-green-400' : 'text-red-400'}`}>
                        {score} / {questions.length}
                    </p>
                    <p className={`text-2xl font-semibold mb-6 ${isPassed ? 'text-green-400' : 'text-red-400'}`}>
                        {isPassed ? '🎉 認証成功！ 🎉' : '認証失敗...'}
                    </p>
                    <p className="text-gray-300 mb-8">
                        {isPassed ? 'あなたは18歳以上であることが確認されました。' : '年齢確認ができませんでした。'}
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                      {isPassed && (
                        <button
                          onClick={() => { try { localStorage.setItem('age_confirmed', '1') } catch {}; window.location.replace('/') }}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
                        >サイトへ進む</button>
                      )}
                      <button
                          onClick={startQuiz}
                          className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105"
                      >
                          もう一度試す
                      </button>
                    </div>
                </div>
            </div>
        );
    }
    
    if (questions.length === 0) return null; // Wait for questions to be loaded

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="bg-gray-900 min-h-screen flex items-center justify-center font-sans text-white p-4">
            <div className="bg-gray-800 p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-2xl">
                <div className="mb-6">
                    <p className="text-cyan-400 font-bold text-xl mb-2">第 {currentQuestionIndex + 1} 問</p>
                    <h2 className="text-xl md:text-2xl font-semibold leading-relaxed">{currentQuestion.question}</h2>
                </div>
                <div className="space-y-4 mb-6">
                    {questions[currentQuestionIndex].optionsOrder.map((key) => (
                        <button
                            key={key}
                            onClick={() => handleSelectAnswer(key)}
                            disabled={isAnswered}
                            className={`w-full text-left font-semibold py-3 px-5 rounded-lg border-2 border-gray-700 transition duration-200 ${getButtonClass(key)}`}
                        >
                            <span className="mr-3">{key}.</span>{currentQuestion.options[key]}
                        </button>
                    ))}
                </div>
                 {isAnswered && currentQuestion.note && (
                    <div className="mb-4 p-3 bg-gray-700 rounded-lg text-sm text-gray-300">
                       💡 {currentQuestion.note}
                    </div>
                 )}
                <div className="mt-6 flex justify-end">
                    {!isAnswered ? (
                        <button
                            onClick={handleSubmit}
                            disabled={selectedAnswer === null}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-8 rounded-lg transition duration-300"
                        >
                            回答する
                        </button>
                    ) : (
                        <button
                            onClick={handleNextQuestion}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-8 rounded-lg transition duration-300"
                        >
                            {currentQuestionIndex < questions.length - 1 ? '次の問題へ' : '結果を見る'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

