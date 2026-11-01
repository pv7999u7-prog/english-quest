// 題庫：英文挑戰王
// 題型 t: 'mc' 選擇（o[0] 是正確答案，遊戲中會打亂）、'tf' 是非、'order' 排序（o 依正確順序；join '' 是拼字、' ' 是重組句子）
// word：答完可以點 🔊 聽單字；say／sayZh：答完可以聽整句；listen：題目一出現就唸（聽力題）
// id 不要改，孩子的作答紀錄是用 id 記的
'use strict';

const TF = ['○ 對', '✕ 錯'];
const BANK = [];

// ═════════ 文法與句子（手寫題）═════════
const fillSay = (q, a) => (/[A-Za-z]/.test(q) && /_{2,}/.test(q) && /^[A-Za-z' ,.!?-]+$/.test(a) ? q.replace(/_{2,}/, a).replace(/\s*（.*?）\s*$/, '').replace(/^.*?：/, '') : undefined);
// 選擇題：G(id, 章, 題目, [正確, 錯…], 說明)
const G = (id, ch, q, o, e, lv) => ({ id, s: 'gra', ch, t: 'mc', q, o, a: 0, e, say: fillSay(q, o[0]), lv });
// 中翻英選擇：Z(id, 章, 中文, [正確英文, 錯…], 說明)
const Z = (id, ch, zh, o, e, lv) => ({ id, s: 'gra', ch, t: 'mc', q: `「${zh}」英文要怎麼說？`, o, a: 0, e: e || '注意句型和動詞形式。', say: o[0], sayZh: zh, lv });
// 是非題：T(id, 章, 英文句子, 是否正確, 說明)
const T = (id, ch, sen, ok, e, fix) => ({ id, s: 'gra', ch, t: 'tf', q: `這句英文文法正確嗎？\n${sen}`, o: TF, a: ok ? 0 : 1, e, say: ok ? sen : fix });
// 重組句子：R(id, 章, 中文, 英文句子)
const R = (id, ch, zh, sen, lv) => ({ id, s: 'gra', ch, t: 'order', q: `把單字排成正確的句子：\n「${zh}」`, o: sen.split(' '), join: ' ', e: sen, say: sen, sayZh: zh, lv });

BANK.push(
  // ── 1 人稱代名詞 ──
  G('g1-01', 1, 'Mom and I → 換成代名詞是？', ['we', 'they', 'us', 'our'], 'Mom and I 是「我們」，當主詞用 we。'),
  G('g1-02', 1, 'the fan → 換成代名詞是？', ['it', 'he', 'she', 'its'], '東西用 it。'),
  G('g1-03', 1, 'You and Amy → 換成代名詞是？', ['you', 'they', 'we', 'your'], '有 you 就是「你們」。'),
  G('g1-04', 1, 'Ms. Smith → 換成代名詞是？', ['she', 'he', 'her', 'it'], 'Ms. 是女性。'),
  G('g1-05', 1, 'This is my sister. ___ is Amy.', ['She', 'Her', 'He', 'Hers'], '當主詞用主格 She。'),
  G('g1-06', 1, 'They are my brothers. ___ names are Peter and Steve.', ['Their', 'They', 'Them', 'There'], '後面接名詞用所有格 Their。'),
  G('g1-07', 1, 'That is Eric\'s grandpa. ___ clothes are so cool.', ['His', 'He', 'Him', 'He\'s'], '所有格 his（他的）。'),
  G('g1-08', 1, 'We like to play with ___.', ['him', 'he', 'his', 'he\'s'], '介係詞 with 後面用受格。'),
  G('g1-09', 1, 'This gift is for ___.', ['them', 'they', 'their', 'theirs'], 'for 後面用受格。'),
  G('g1-10', 1, 'Those flowers are very beautiful. ___ colors are different.', ['Their', 'There', 'They', 'Its'], '花的顏色 → 它們的 their。'),
  G('g1-11', 1, '「Derek 和 Julie 是兄弟姊妹，他們的爸媽是老師」要寫成？', ['Derek and Julie\'s parents are teachers.', 'Derek\'s and Julie\'s parents are teachers.', 'Derek and Julie parents are teachers.', 'Derek\'s and Julie parents are teachers.'], '共同擁有：A and B\'s。', 2),
  G('g1-12', 1, '「那些工人的」要寫成？', ['those workers\'', 'those worker\'s', 'those workers\'s', 'those workers'], '字尾有 s 的複數名詞只加 \'。', 2),
  T('g1-13', 1, 'This is the my book.', false, '所有格前面不能再加 the。', 'This is my book.'),
  T('g1-14', 1, 'You, he and I are good friends.', true, '單數人稱順序：2 → 3 → 1。'),
  R('g1-15', 1, '他們的名字是彼得和史提夫。', 'Their names are Peter and Steve.'),
  Z('g1-16', 1, '這份禮物是給他們的。', ['This gift is for them.', 'This gift is for they.', 'This gift is for their.', 'This gift is them.']),

  // ── 2 be 動詞 ──
  G('g2-01', 2, 'Derek ___ an English teacher.', ['is', 'am', 'are', 'be'], '單數主詞用 is。'),
  G('g2-02', 2, 'They ___ Peter and Amanda.', ['are', 'is', 'am', 'be'], '複數主詞用 are。'),
  G('g2-03', 2, 'I ___ Jerry.', ['am', 'is', 'are', 'be'], 'I 用 am。'),
  G('g2-04', 2, 'My father\'s sisters ___ kind.', ['are', 'is', 'am', 'be'], '主詞是 sisters（複數）。'),
  G('g2-05', 2, 'Its name ___ Kitty.', ['is', 'are', 'am', 'be'], '主詞 name 是單數。'),
  G('g2-06', 2, 'She is ___ actress.', ['an', 'a', 'the', '（不填）'], 'actress 母音開頭用 an。'),
  G('g2-07', 2, 'Jimmy is ___ university student.', ['a', 'an', 'the', '（不填）'], 'university 唸 [ju]，是子音開頭，用 a。', 2),
  G('g2-08', 2, 'His uncle ___ very tall.', ['is', 'are', 'am', 'be'], 'His uncle 單數。'),
  G('g2-09', 2, 'I am not 可以縮寫成？', ['I\'m not', 'I amn\'t', 'I\'mn\'t', '不能縮寫'], 'am not 不能縮寫，但 I am 可以縮成 I\'m。'),
  T('g2-10', 2, 'He is a elementary school student.', false, 'elementary 母音開頭要用 an。', 'He is an elementary school student.'),
  T('g2-11', 2, 'That\'s an umbrella.', true, 'umbrella 母音開頭用 an。'),
  T('g2-12', 2, 'The horse is tall big.', false, '兩個形容詞中間要加 and。', 'The horse is tall and big.'),
  R('g2-13', 2, '她不是蔡依林。', 'She is not Jolin.'),
  R('g2-14', 2, 'Carey 是一位英文老師。', 'Carey is an English teacher.'),
  Z('g2-15', 2, '那些人沒有遲到。', ['Those people aren\'t late.', 'Those people isn\'t late.', 'Those people don\'t late.', 'Those people not late.']),
  Z('g2-16', 2, '我們是母女。', ['We are mother and daughter.', 'We is mother and daughter.', 'We am mother and daughter.', 'Our are mother and daughter.']),
  G('g2-17', 2, 'They are oranges. 改成單數句：', ['It is an orange.', 'It is a orange.', 'They is an orange.', 'It are an orange.'], '複數 they are → 單數 it is，orange 前用 an。'),

  // ── 3 be 動詞問句 ──
  G('g3-01', 3, 'Is Bruno Mars a singer? — Yes, ___.', ['he is', 'he\'s', 'she is', 'it is'], '肯定簡答不能縮寫。'),
  G('g3-02', 3, 'Are Peter and Amanda your parents? — Yes, ___.', ['they are', 'they\'re', 'we are', 'he is'], '兩個人 → they；肯定簡答不縮寫。'),
  G('g3-03', 3, 'Is your mother a nurse? — No, ___.', ['she isn\'t', 'she not', 'he isn\'t', 'she aren\'t'], '否定簡答可以縮寫。'),
  G('g3-04', 3, 'Are you and Victor classmates? — No, ___.', ['we aren\'t', 'you aren\'t', 'they aren\'t', 'I\'m not'], 'you and Victor → 回答時是 we。'),
  G('g3-05', 3, 'Aren\'t you a taxi driver?（我是）— ___', ['Yes, I am.', 'No, I am.', 'Yes, I\'m not.', 'No, I\'m.'], '否定疑問句：事實「是」就說 Yes。', 2),
  G('g3-06', 3, 'Isn\'t that pretty girl your new classmate?（她是）— Yes, ___.', ['she is', 'she isn\'t', 'that is', 'I don\'t know'], '事實是 → Yes, she is.', 2),
  G('g3-07', 3, 'Is that your photo? — No, ___. It is a poster.', ['it isn\'t', 'that isn\'t', 'it is', 'they aren\'t'], '回答時 that 換成 it。'),
  G('g3-08', 3, '___ Tim and his parents at the concert?', ['Are', 'Is', 'Am', 'Do'], '主詞複數用 Are。'),
  T('g3-09', 3, 'Is not Ann a junior high school student?', false, '否定疑問句要縮寫：Isn\'t Ann…?', 'Isn\'t Ann a junior high school student?'),
  T('g3-10', 3, 'Are you an engineer? — Yes, I\'m.', false, '肯定簡答不能縮寫：Yes, I am.', 'Yes, I am.'),
  R('g3-11', 3, 'Miller 是一位畫家嗎？', 'Is Miller a painter?'),
  R('g3-12', 3, '那隻烏龜是你的寵物嗎？', 'Is that turtle your pet?'),
  Z('g3-13', 3, '他不是我們的朋友嗎？', ['Isn\'t he our friend?', 'Is not he our friend?', 'Aren\'t he our friend?', 'Doesn\'t he our friend?'], '否定疑問句 be 和 not 要縮寫放句首。', 2),
  G('g3-14', 3, 'Pikachu is a pocket monster. 改成問句：', ['Is Pikachu a pocket monster?', 'Pikachu is a pocket monster?', 'Are Pikachu a pocket monster?', 'Does Pikachu a pocket monster?'], 'be 動詞移到句首。'),

  // ── 4 名詞單複數 ──
  G('g4-01', 4, 'child 的複數是？', ['children', 'childs', 'childes', 'childrens'], '不規則變化。'),
  G('g4-02', 4, 'leaf 的複數是？', ['leaves', 'leafs', 'leafes', 'leavs'], 'f → ves。'),
  G('g4-03', 4, 'box 的複數是？', ['boxes', 'boxs', 'boxies', 'box'], 'x 結尾加 es。'),
  G('g4-04', 4, 'city 的複數是？', ['cities', 'citys', 'cityes', 'cites'], '子音＋y → ies。'),
  G('g4-05', 4, 'toy 的複數是？', ['toys', 'toies', 'toyes', 'tois'], '母音＋y 直接加 s。'),
  G('g4-06', 4, 'tomato 的複數是？', ['tomatoes', 'tomatos', 'tomatoies', 'tomato'], '子音＋o 加 es。'),
  G('g4-07', 4, 'photo 的複數是？', ['photos', 'photoes', 'photies', 'photo'], 'photo 是例外，只加 s。', 2),
  G('g4-08', 4, 'sheep 的複數是？', ['sheep', 'sheeps', 'sheepes', 'shoop'], '單複數同形。'),
  G('g4-09', 4, 'foot 的複數是？', ['feet', 'foots', 'feets', 'footes'], '不規則變化。'),
  G('g4-10', 4, 'housewife 的複數是？', ['housewives', 'housewifes', 'housewifs', 'housewivs'], 'fe → ves。'),
  G('g4-11', 4, 'lunch box 的複數是？', ['lunch boxes', 'lunches boxes', 'lunches box', 'lunch boxs'], '複合名詞只變第二個字。', 2),
  G('g4-12', 4, '下列哪一個是「不可數名詞」？', ['juice', 'hamburger', 'ticket', 'kangaroo'], 'juice、milk、bread、money 是不可數。'),
  G('g4-13', 4, 'My family ___ eating dinner now.', ['are', 'is', 'am', 'be'], 'family 當「家人」時是複數。', 2),
  T('g4-14', 4, 'There are two fishes in the fish bowl.', false, 'fish 單複數同形。', 'There are two fish in the fish bowl.'),
  T('g4-15', 4, 'Peter and Joe are tall boys.', true, '兩個人 → 複數 boys。'),
  G('g4-16', 4, 'It is a sheep. 改成複數句：', ['They are sheep.', 'They are sheeps.', 'It are sheep.', 'They is sheep.'], 'sheep 單複數同形。'),
  Z('g4-17', 4, '我的女兒們是家庭主婦。', ['My daughters are housewives.', 'My daughters are housewifes.', 'My daughter are housewives.', 'My daughters is housewives.']),

  // ── 5 指示代名詞 ──
  G('g5-01', 5, 'Are those her glasses? — Yes, ___.', ['they are', 'those are', 'it is', 'these are'], '簡答 those 換成 they。'),
  G('g5-02', 5, 'What are those? — ___ are pencils.', ['They', 'Those', 'It', 'These'], '回答用 they。'),
  G('g5-03', 5, 'What is that? — ___ is a fork.', ['It', 'That', 'This', 'They'], '回答用 it。'),
  G('g5-04', 5, '___ notebooks are great.', ['The', 'This', 'That', 'A'], 'notebooks 複數，不能用 this / that。'),
  G('g5-05', 5, 'Is this ___?', ['your pencil', 'pencil', 'pencils', 'not pencil'], '單數可數名詞前要有 a / your 等。'),
  G('g5-06', 5, '___ cakes are beautiful.', ['These', 'This', 'That', 'A'], 'cakes 複數用 these。'),
  G('g5-07', 5, 'That is a lunch box. 改成複數句：', ['Those are lunch boxes.', 'Those are lunches boxes.', 'That are lunch boxes.', 'Those is lunch boxes.'], 'that → those、is → are。'),
  G('g5-08', 5, 'Are those erasers? 改成單數：', ['Is that an eraser?', 'Is that a eraser?', 'Are that an eraser?', 'Is those an eraser?'], 'eraser 母音開頭用 an。'),
  T('g5-09', 5, 'These pens are good.', true, 'these＋複數名詞＋are。'),
  T('g5-10', 5, 'That desk is a good.', false, '形容詞後面沒有名詞時不加 a。', 'That desk is good.'),
  R('g5-11', 5, '這些漫畫書很有趣。', 'These comic books are interesting.'),
  R('g5-12', 5, '那些是他的彩色筆。', 'Those are his markers.'),
  Z('g5-13', 5, '那些女人是我的妻子們。', ['Those women are my wives.', 'Those woman are my wives.', 'That women is my wife.', 'Those women is my wives.'], 'woman → women、wife → wives。', 2),

  // ── 6 招呼語、What ──
  G('g6-01', 6, 'Nice to meet you. — ___', ['Nice to meet you, too.', 'Fine, thank you.', 'You\'re welcome.', 'Good night.'], '回答要加 too。'),
  G('g6-02', 6, 'How do you do? — ___', ['How do you do?', 'I\'m fine.', 'I do my homework.', 'Yes, I do.'], '初次見面的正式招呼，回答同一句。'),
  G('g6-03', 6, 'Thank you very much. — ___', ['You\'re welcome.', 'I\'m sorry.', 'Never mind.', 'Good morning.'], '道謝 → You\'re welcome. / My pleasure.'),
  G('g6-04', 6, 'I\'m sorry. — ___', ['That\'s OK.', 'You\'re welcome.', 'Thank you.', 'Me too.'], '道歉 → That\'s OK. / Never mind.'),
  G('g6-05', 6, '晚上睡覺前要說？', ['Good night.', 'Good evening.', 'Good afternoon.', 'Good morning.'], 'Good night 是睡前、道別。'),
  G('g6-06', 6, 'What\'s the girl\'s name? — ___', ['Her name is Tina.', 'His name is Tina.', 'She name is Tina.', 'Her is Tina.'], '女生 → her name。'),
  G('g6-07', 6, 'What are you? — ___', ['I am a mail carrier.', 'I am fine.', 'I am Tom.', 'I am in the park.'], 'What are you? 問職業。'),
  G('g6-08', 6, '稱呼「史密斯先生」要寫？', ['Mr. Smith', 'Mrs. Smith', 'Mr. Bob', 'Miss Smith'], 'Mr.＋姓。'),
  G('g6-09', 6, 'What are these? — ___', ['They are my brother\'s new robots.', 'It is my brother\'s new robots.', 'These is robots.', 'Yes, they are.'], '複數用 they are；What 問句不用 Yes/No 回答。'),
  T('g6-10', 6, 'Good morning, Mr. Bob.', false, 'Mr. 後面要接姓，不能只接名字。', 'Good morning, Mr. Brown.'),
  R('g6-11', 6, '她的名字是 Tina。', 'Her name is Tina.'),
  Z('g6-12', 6, '你父親好嗎？—他相當好。', ['How is your father? — He is pretty good.', 'What is your father? — He is pretty good.', 'Who is your father? — He is pretty good.', 'How is your father? — He is a teacher.']),
  G('g6-13', 6, '下列哪一個是職業？', ['firefighter', 'beautiful', 'classroom', 'Monday'], 'firefighter 消防員。'),

  // ── 7 Who、電話 ──
  G('g7-01', 7, '___ is the little girl with long hair? — She is my niece.', ['Who', 'What', 'Where', 'How'], '問姓名、關係用 Who。'),
  G('g7-02', 7, '___ is the man over there? — A police officer.', ['What', 'Who', 'Where', 'How'], '問職業用 What。'),
  G('g7-03', 7, '（有人敲門）Who is it? — ___ is Jessica.', ['It', 'She', 'This', 'I'], '應門時用 it。'),
  G('g7-04', 7, 'Who ___ in the kitchen? — My family are.', ['is', 'are', 'am', 'be'], 'Who 當主詞用 is。'),
  G('g7-05', 7, '打電話找 Derek：___', ['May I speak to Derek, please?', 'Are you Derek?', 'I am Fifi. Who are you?', 'Where is Derek?'], '最有禮貌的說法。'),
  G('g7-06', 7, 'May I speak to John, please? — （John 本人）___', ['Speaking.', 'Hold on, please.', 'Sorry.', 'Wait a minute, please.'], '本人接電話：Speaking. / This is he.'),
  G('g7-07', 7, '電話中問「你是哪位？」要說？', ['Who\'s calling?', 'Who are you?', 'What are you?', 'How are you?'], '電話中用 Who\'s calling?'),
  G('g7-08', 7, '對方打錯電話，你要說？', ['Sorry, you have the wrong number.', 'Hold on, please.', 'Speaking.', 'Can I take a message?'], 'wrong number 打錯電話。'),
  G('g7-09', 7, '電話中說「我是 Fifi」：', ['This is Fifi.', 'I am Fifi.', 'Here is Fifi.', 'It is Fifi.'], '電話中「我就是」用 This is…'),
  G('g7-10', 7, 'This is Victor. ___ — Hold on, please.', ['Is Irene there?', 'Is she Irene?', 'Who\'s calling?', 'What are you doing?'], '找人：Is ~ there?'),
  T('g7-11', 7, 'Can I take a message?', true, '要幫對方留言。'),
  R('g7-12', 7, '他是我的哥哥 Bob。', 'He is my brother, Bob.'),
  Z('g7-13', 7, '你可以晚點回電嗎？', ['Could you call back later?', 'Could you call later back me?', 'Can you calling back later?', 'Could you back call later?']),

  // ── 8 數字、How old ──
  G('g8-01', 8, '40 的英文是？', ['forty', 'fourty', 'fourteen', 'fortey'], 'forty 沒有 u。'),
  G('g8-02', 8, '15 的英文是？', ['fifteen', 'fiveteen', 'fifty', 'fivteen'], 'fifteen。'),
  G('g8-03', 8, '27 的英文是？', ['twenty-seven', 'twenty seven teen', 'seventy-two', 'twelve-seven'], '十位數－個位數。'),
  G('g8-04', 8, '168 的英文是？', ['one hundred and sixty-eight', 'one hundred sixteen eight', 'sixteen eight', 'one sixty-eight hundred'], 'hundred 百。'),
  G('g8-05', 8, 'Nine and three ___ twelve.', ['is', 'are', 'am', 'be'], '加法用 is。'),
  G('g8-06', 8, '___ is twelve and fifteen?', ['What', 'How', 'Who', 'Where'], '問「幾加幾等於多少」用 What。'),
  G('g8-07', 8, 'How old is your daughter? — She is one ___ old.', ['year', 'years', 'year\'s', 'yeas'], '1 歲 year 不加 s。'),
  G('g8-08', 8, 'Troye is ___ boy.', ['an eleven-year-old', 'a eleven-year-old', 'an eleven-years-old', 'eleven years old'], '當形容詞 year 不加 s，eleven 母音開頭用 an。', 2),
  G('g8-09', 8, '電話號碼 0955 中的「55」可以唸？', ['double five', 'fifty-five', 'two five', 'five and five'], '兩個相同數字用 double。'),
  G('g8-10', 8, '1,200,000 的英文是？', ['one million two hundred thousand', 'twelve hundred thousand million', 'one billion two hundred', 'one million two thousand'], '第二個逗號是 million。', 2),
  T('g8-11', 8, 'Fourteen and five is not seventeen.', true, '14＋5＝19，不是 17。'),
  R('g8-12', 8, '我 28 歲時成為獸醫。', 'I became a vet at the age of twenty-eight.', 2),
  Z('g8-13', 8, '你的電話號碼幾號？', ['What is your telephone number?', 'How is your telephone number?', 'Who is your telephone number?', 'What are you telephone number?']),

  // ── 9 How、形容詞 ──
  G('g9-01', 9, 'How are you doing? — ___', ['Fine, thank you.', 'I am Carol.', 'I am cooking.', 'No, it is not great.'], 'How are you? 問狀況。'),
  G('g9-02', 9, 'How ___ your father and mother? — They are fine.', ['are', 'is', 'am', 'do'], '主詞複數。'),
  G('g9-03', 9, '「一位可愛的年輕小姐」正確順序是？', ['a cute young lady', 'a young cute lady', 'a lady cute young', 'cute a young lady'], '看法 → 年齡。'),
  G('g9-04', 9, '「一棟大的老房子」正確順序是？', ['a big old house', 'an old big house', 'a old big house', 'a house big old'], '尺寸 → 年齡。'),
  G('g9-05', 9, '「一輛新的黃色腳踏車」正確順序是？', ['a new yellow bike', 'a yellow new bike', 'an new yellow bike', 'a bike new yellow'], '年齡 → 顏色。'),
  G('g9-06', 9, 'The scooter is blue. ＝ It is ___.', ['a blue scooter', 'a scooter blue', 'blue a scooter', 'an blue scooter'], '形容詞放名詞前面。'),
  G('g9-07', 9, 'Is the boy thin? — No, he\'s ___.', ['fat', 'thin', 'young', 'short'], 'thin 瘦 ↔ fat 胖。'),
  G('g9-08', 9, 'Is Tina sad? — No, she\'s ___ happy girl.', ['a', 'an', 'not', '（不填）'], '形容詞＋名詞前面要有 a。', 2),
  T('g9-09', 9, 'Is that a girl your sister?', false, 'that 和 a 不能一起用。', 'Is that girl your sister?'),
  T('g9-10', 9, 'That joke is really interesting.', true, 'really 修飾形容詞。'),
  R('g9-11', 9, '那是一隻聰明的猴子。', 'That is a smart monkey.'),
  R('g9-12', 9, '她是一個聰明的女孩。', 'She is an intelligent girl.'),
  Z('g9-13', 9, '懷特先生的父親如此勤勞。', ['Mr. White\'s father is so hard-working.', 'Mr. White father is so hard-working.', 'Mr. White\'s father so hard-working.', 'Mr. White\'s father are so hard-working.']),

  // ── 10 How tall、Where、國籍 ──
  G('g10-01', 10, 'How tall is Jeremy Lin? — He is 191 ___ tall.', ['centimeters', 'centimeter', 'years', 'kilograms'], '身高用 centimeters。'),
  G('g10-02', 10, 'Where ___ you from? — I\'m from the USA.', ['are', 'is', 'do', 'am'], 'Where are you from?'),
  G('g10-03', 10, 'Is Alex from France? — Yes, he ___.', ['is', 'does', 'are', 'from'], 'be 動詞問，be 動詞答。'),
  G('g10-04', 10, 'Where is Peter ___? — India.', ['from', 'for', 'to', 'in'], '問來自哪裡要加 from。'),
  G('g10-05', 10, 'Are Mark and Sally from the UK? — No, ___. They are from India.', ['they aren\'t', 'they are', 'he isn\'t', 'we aren\'t'], '兩個人用 they。'),
  G('g10-06', 10, '「美國」的英文是？', ['the USA', 'the Japan', 'USA the', 'Americas'], '國名 the USA、the UK 要加 the。'),
  G('g10-07', 10, '問陌生人「請問圖書館在哪裡？」', ['Excuse me, where is the library?', 'Where the library is?', 'Hey, library where?', 'Excuse me, where library?'], '先說 Excuse me 比較禮貌。'),
  G('g10-08', 10, 'Where are 可以縮寫嗎？', ['不可以', '可以寫成 Where\'re', '可以寫成 Where\'s', '可以寫成 Wherere'], 'Where is ＝ Where\'s，但 Where are 不能縮寫。', 2),
  T('g10-09', 10, 'The new classmate is from California, the USA.', true, '先小地方再大地方。'),
  R('g10-10', 10, '那些外國人來自哪裡？', 'Where are those foreigners from?'),
  Z('g10-11', 10, '他的父母都是五呎六吋高。', ['His parents are both five feet six inches tall.', 'His parents are both five foot six inch tall.', 'His parents both are five feets six inches tall.', 'His parents is both five feet six inches tall.'], 'foot 的複數是 feet。', 2),

  // ── 11 地方介係詞 ──
  G('g11-01', 11, 'Pikachu sits ___ Doraemon and Hello Kitty.', ['between', 'among', 'behind', 'next'], 'between A and B。'),
  G('g11-02', 11, 'Look! Two birds are singing ___ the tree.', ['in', 'on', 'from', 'next'], '外來的東西在樹上用 in the tree。'),
  G('g11-03', 11, 'He is sleeping ___.', ['in bed', 'on the bed', 'in the bed', 'at bed'], '躺在床上睡覺用 in bed。'),
  G('g11-04', 11, 'Look! Jolin is ___ TV now.', ['on', 'in', 'at', 'under'], '在電視節目裡用 on TV。'),
  G('g11-05', 11, 'Who\'s ___ the door? — John\'s sister, Carol.', ['at', 'on', 'in', 'for'], '在門口用 at the door。'),
  G('g11-06', 11, 'My grandparents live ___ New York.', ['in', 'at', 'on', 'to'], '大地方用 in。'),
  G('g11-07', 11, 'I live ___ Park Street.', ['on', 'in', 'at', 'to'], '街名用 on。'),
  G('g11-08', 11, 'The teacher is standing ___ front of the classroom.（教室裡面的前方）', ['in the', 'in', 'on the', 'at'], '在裡面的前端用 in the front of。', 2),
  G('g11-09', 11, 'Kitty is behind Rosa. Kitty is in front of Frank. 下列何者正確？', ['Frank is behind Kitty and Rosa.', 'Rosa is between Kitty and Frank.', 'Frank is in front of Rosa.', 'Kitty is not between Rosa and Frank.'], '由前到後的順序是 Rosa → Kitty → Frank，所以 Frank 在 Kitty 和 Rosa 後面。', 2),
  T('g11-10', 11, 'Come to here.', false, 'here 前面不加介係詞。', 'Come here.'),
  T('g11-11', 11, 'Where are we? — We are on page 49.', true, '在第幾頁用 on page…'),
  R('g11-12', 11, '那棵樹在車子前面。', 'The tree is in front of the car.'),
  Z('g11-13', 11, '對不起，請問加油站在哪裡？', ['Excuse me, where is the gas station?', 'Excuse me, where the gas station is?', 'Sorry, gas station where?', 'Excuse me, what is the gas station?']),

  // ── 12 祈使句、Let's ──
  G('g12-01', 12, '___ a good boy, Jack.', ['Be', 'Is', 'Are', 'Do'], '祈使句用原形動詞，be 動詞原形是 be。'),
  G('g12-02', 12, '___ quiet in class.', ['Be', 'Don\'t', 'Is', 'Not'], 'Be quiet. 安靜。'),
  G('g12-03', 12, 'Leo, ___ late for school.', ['don\'t be', 'don\'t', 'isn\'t', 'doesn\'t'], '否定祈使句：Don\'t be…'),
  G('g12-04', 12, 'Let\'s ___ this game again. It is fun.', ['play', 'playing', 'plays', 'to play'], 'Let\'s＋原形動詞。'),
  G('g12-05', 12, 'It\'s late at night. ___ dance now. Mom and Dad are sleeping.', ['Let\'s not', 'Let\'s don\'t', 'Don\'t let\'s', 'Let\'s no'], '否定：Let\'s not＋原形動詞。'),
  G('g12-06', 12, '「禁止吸菸」的標語是？', ['No smoking.', 'No smoke.', 'Don\'t smoking.', 'Not smoking.'], 'No＋V-ing。'),
  G('g12-07', 12, '___ the bench. The sign says "Wet Paint".', ['Don\'t touch', 'Touching', 'Not touch', 'Touches'], '否定祈使句：Don\'t＋原形動詞。'),
  G('g12-08', 12, '選出錯誤的句子：', ['Please Tina, stand up.', 'Tina, stand up, please.', 'Tina, please stand up.', 'Please stand up, Tina.'], '稱呼語要用逗號隔開，不能夾在 Please 和動詞中間。', 2),
  G('g12-09', 12, 'Always ___ nice to others.', ['be', 'are', 'is', 'being'], 'Always＋原形動詞。'),
  T('g12-10', 12, 'Is a good student.', false, '祈使句要用原形：Be a good student.', 'Be a good student.'),
  T('g12-11', 12, 'Peter, don\'t talk in class.', true, '稱呼語＋逗號＋否定祈使句。'),
  R('g12-12', 12, '請不要違反校規。', 'Please don\'t break the school rules.'),
  R('g12-13', 12, '我們來試試牛肉麵吧。', 'Let\'s try the beef noodles.'),
  Z('g12-14', 12, '不要在牆上寫字或畫畫。', ['Don\'t write or draw on the wall.', 'Don\'t write and draw on the wall.', 'Not write or draw on the wall.', 'Don\'t writing or drawing on the wall.'], '否定句用 or。', 2),
  Z('g12-15', 12, '讓我們想想看。', ['Let us think about it.', 'Let\'s thinking about it.', 'Let us thinks about it.', 'Let we think about it.']),

  // ── 13 連接詞、too / either ──
  G('g13-01', 13, 'My grandfather is old ___ strong.', ['but', 'and', 'or', 'so'], '意思相反用 but。'),
  G('g13-02', 13, 'Do you want tea ___ coffee?', ['or', 'and', 'but', 'too'], '選擇用 or。'),
  G('g13-03', 13, 'Jack and I ___ father and son.', ['are', 'is', 'am', 'be'], 'and 連接兩個主詞 → 複數。'),
  G('g13-04', 13, 'You or I ___ right.', ['am', 'are', 'is', 'be'], 'or 連接主詞 → 跟最近的主詞 I。', 2),
  G('g13-05', 13, 'He\'s a singer, and I am, ___.', ['too', 'either', 'also', 'so'], '肯定句「也」用 too。'),
  G('g13-06', 13, 'My brother can\'t drive, and I can\'t, ___.', ['either', 'too', 'also', 'neither'], '否定句「也不」用 either。'),
  G('g13-07', 13, 'Mr. Wang is a dentist. His wife ___.', ['is, too', 'isn\'t, too', 'is, either', 'isn\'t, either'], '肯定 → is, too。'),
  G('g13-08', 13, 'My cousin doesn\'t speak English. I don\'t, ___.', ['either', 'too', 'also', 'so'], '否定 → either。'),
  G('g13-09', 13, 'Is it Tuesday or Wednesday today? — ___', ['Wednesday.', 'Yes, it is.', 'No, it isn\'t.', 'Yes, Wednesday.'], '選擇問句不用 Yes / No 回答。'),
  T('g13-10', 13, 'Mr. Chen isn\'t rich or handsome.', true, '否定句用 or：既不…也不…'),
  R('g13-11', 13, '我們吃了一個漢堡和兩個三明治。', 'We ate a hamburger and two sandwiches.'),
  R('g13-12', 13, '這頓飯好吃但是很貴。', 'The meal is delicious but expensive.'),
  Z('g13-13', 13, '約翰不高興，我也不高興。', ['John isn\'t happy, and I\'m not, either.', 'John isn\'t happy, and I\'m not, too.', 'John isn\'t happy, and I am, either.', 'John isn\'t happy, or I\'m not, too.']),

  // ── 14 現在進行式 ──
  G('g14-01', 14, 'Look! The cute baby ___ now!', ['is smiling', 'smiles', 'smiling', 'smile'], 'Look! → 進行式。'),
  G('g14-02', 14, 'run 的 V-ing 是？', ['running', 'runing', 'runnning', 'runs'], '短母音＋子音，重複字尾。'),
  G('g14-03', 14, 'write 的 V-ing 是？', ['writing', 'writeing', 'writting', 'writes'], '不發音的 e 去掉再加 ing。'),
  G('g14-04', 14, 'swim 的 V-ing 是？', ['swimming', 'swiming', 'swimeing', 'swims'], '重複字尾 m。'),
  G('g14-05', 14, 'picnic 的 V-ing 是？', ['picnicking', 'picnicing', 'picnicinng', 'picnics'], '特殊變化。', 2),
  G('g14-06', 14, 'Are the kids sleeping in the bedroom? — No, ___.', ['they aren\'t', 'they don\'t', 'they isn\'t', 'they not'], 'be 動詞問，be 動詞答。'),
  G('g14-07', 14, '___ is Sam listening to now?', ['What', 'Who', 'Where', 'How'], '問「在聽什麼」用 What。'),
  G('g14-08', 14, 'The fans ___ in line for the band now.', ['are waiting', 'wait', 'waits', 'to wait'], 'now → 進行式。'),
  G('g14-09', 14, 'Amy is ___ now.', ['having dinner', 'joging in the park', 'writeing a letter', 'eatting snacks'], '拼字：jogging、writing、eating。', 2),
  G('g14-10', 14, 'I study English every day. 把 every day 換成 now：', ['I am studying English now.', 'I studying English now.', 'I am study English now.', 'I studies English now.'], 'be＋V-ing。'),
  T('g14-11', 14, 'He watching TV now.', false, '少了 be 動詞：He is watching TV now.', 'He is watching TV now.'),
  T('g14-12', 14, 'Bill and his classmates are running.', true, '複數主詞＋are＋V-ing。'),
  R('g14-13', 14, '我們現在正在玩線上遊戲。', 'We are playing online games now.'),
  R('g14-14', 14, 'Jay 正在看電視，不是在寫功課。', 'Jay is watching TV, not doing his homework.', 2),
  Z('g14-15', 14, '媽媽沒有在做蛋糕。', ['Mom isn\'t making a cake.', 'Mom doesn\'t making a cake.', 'Mom isn\'t make a cake.', 'Mom not making a cake.']),

  // ── 15 時間與星期 ──
  G('g15-01', 15, 'What ___ is it? — It\'s ten o\'clock.', ['time', 'day', 'date', 'clock'], '問幾點用 What time。'),
  G('g15-02', 15, 'What ___ is it today? — It\'s Thursday.', ['day', 'time', 'week', 'date'], '問星期幾用 What day。'),
  G('g15-03', 15, '8:45 可以說成？', ['a quarter to nine', 'a quarter past eight', 'forty-five to eight', 'half past eight'], '差 15 分到 9 點。'),
  G('g15-04', 15, '2:30 可以說成？', ['half past two', 'half to three', 'thirty to two', 'a quarter past two'], '半點用 half past，不能用 to。'),
  G('g15-05', 15, '11:50 可以說成？', ['ten to twelve', 'ten after twelve', 'ten to eleven', 'fifty after twelve'], '差 10 分到 12 點。'),
  G('g15-06', 15, 'My birthday is ___ Wednesday.', ['on', 'in', 'at', 'to'], '星期前用 on。'),
  G('g15-07', 15, 'The test is ___ nine forty this afternoon.', ['at', 'on', 'in', 'to'], '幾點用 at。'),
  G('g15-08', 15, 'Hurry up! It\'s time ___ class.', ['for', 'to', 'after', 'with'], 'It\'s time for＋名詞。'),
  G('g15-09', 15, 'The meet-and-greet is ___ 4 p.m. ___ 6 p.m.', ['from; to', 'at; at', 'on; and', 'to; at'], 'from…to… 從…到…'),
  G('g15-10', 15, 'Do you have the time? 是在問？', ['現在幾點', '你有沒有空', '你幾歲', '今天星期幾'], 'Do you have the time? ＝ What time is it?', 2),
  G('g15-11', 15, '「每個星期三」可以說成？', ['on Wednesdays', 'on Wednesday\'s', 'in Wednesdays', 'at Wednesday'], 'on＋星期＋s。', 2),
  T('g15-12', 15, 'The game is at nine o\'clocks.', false, 'o\'clock 不加 s。', 'The game is at nine o\'clock.'),
  R('g15-13', 15, '我們每個星期三有英文課。', 'We have English every Wednesday.'),
  Z('g15-14', 15, '現在是早上九點三十分。', ['It\'s nine thirty in the morning.', 'It\'s nine thirty on the morning.', 'It\'s half to ten in the morning.', 'It\'s thirty nine in the morning.']),

  // ── 16 There is / are ──
  G('g16-01', 16, 'There ___ two erasers on the desk.', ['are', 'is', 'have', 'has'], '後面是複數名詞用 are。'),
  G('g16-02', 16, 'There ___ some milk in the refrigerator.', ['is', 'are', 'have', 'has'], 'milk 不可數，用 is。'),
  G('g16-03', 16, 'There ___ a bunch of bananas and apples in the basket.', ['are', 'is', 'have', 'has'], '香蕉和蘋果是複數。', 2),
  G('g16-04', 16, 'Is there a cellphone in your bag? — No, ___.', ['there isn\'t', 'it isn\'t', 'there aren\'t', 'there is'], '用 there is / are 回答。'),
  G('g16-05', 16, 'Are there any tigers in the zoo? — No, ___.', ['there aren\'t', 'there isn\'t', 'they aren\'t', 'there are'], '複數用 aren\'t。'),
  G('g16-06', 16, '___ pencil boxes are there on the table? — Two.', ['How many', 'How much', 'What', 'How old'], '問數量用 How many＋複數名詞。'),
  G('g16-07', 16, 'There are no ___ in my room.', ['robots', 'robot', 'a robot', 'water'], 'There are no＋複數名詞。'),
  G('g16-08', 16, 'There are some monkeys ___ in the tree.', ['jumping', 'jump', 'are jumping', 'jumps'], 'There be 可以接 V-ing。', 2),
  G('g16-09', 16, '「公車來了」的英文是？', ['Here comes the bus.', 'Here the bus comes.', 'The bus here comes.', 'Here is the bus come.'], '普通名詞放後面。'),
  G('g16-10', 16, '「他來了」的英文是？', ['Here he comes.', 'Here comes he.', 'He here comes.', 'Comes he here.'], '代名詞放在動詞前面。', 2),
  G('g16-11', 16, '遞東西給別人時說：', ['Here you are.', 'Here I am.', 'Here we are.', 'There you go are.'], 'Here you are. 你要的東西在這裡。'),
  T('g16-12', 16, 'There have many students in the park.', false, '「有」要用 There are。', 'There are many students in the park.'),
  T('g16-13', 16, 'There is no juice in the glass.', true, 'There is no＋不可數名詞。'),
  R('g16-14', 16, '樹上有一些無尾熊。', 'There are some koalas in the tree.'),
  R('g16-15', 16, '花園裡有幾隻可愛的小狗？', 'How many cute puppies are there in the garden?', 2),
  Z('g16-16', 16, '桌子上沒有七顆蘋果。', ['There aren\'t seven apples on the table.', 'There isn\'t seven apples on the table.', 'There don\'t have seven apples on the table.', 'There aren\'t seven apple on the table.']),

  // ── 17 can ──
  G('g17-01', 17, 'Peter can ___.', ['jump', 'jumps', 'to jump', 'jumping'], 'can＋原形動詞。'),
  G('g17-02', 17, 'Can your young brother write? — No, he ___.', ['can\'t', 'doesn\'t', 'can', 'isn\'t'], '用 can 問就用 can 答。'),
  G('g17-03', 17, 'What can Mary ___? — She can dance.', ['do', 'play', 'sing', 'run'], 'What can＋主詞＋do？'),
  G('g17-04', 17, 'The koala can climb trees, but the snake ___.', ['can\'t', 'can', 'does', 'doesn\'t'], 'but 前後意思相反。'),
  G('g17-05', 17, 'Can the bear ___?', ['swim', 'swims', 'swimming', 'to swim'], 'can＋原形動詞。'),
  G('g17-06', 17, 'Who can play the piano? — Linda\'s cousin ___.', ['can', 'does', 'is', 'plays'], 'Who 當主詞，用 can 回答。'),
  G('g17-07', 17, 'Where can we have a picnic? — ___', ['In the park.', 'Yes, we can.', 'No, we can\'t.', 'We are happy.'], 'Wh- 問句不用 Yes/No。'),
  G('g17-08', 17, 'A monkey can climb trees and ___.', ['walk on its legs', 'walks on its legs', 'walking on its legs', 'can\'t walk on its legs'], 'and 連接兩個原形動詞。', 2),
  T('g17-09', 17, 'I can doing a magic trick.', false, 'can 後面接原形動詞。', 'I can do a magic trick.'),
  T('g17-10', 17, 'People can\'t eat or drink in the library.', true, '否定句用 or。'),
  R('g17-11', 17, '我們在音樂課可以唱歌。', 'We can sing in music class.'),
  R('g17-12', 17, '我要怎麼到達火車站？', 'How can I get to the train station?', 2),
  Z('g17-13', 17, '你會拉小提琴嗎？—是的，我會。', ['Can you play the violin? — Yes, I can.', 'Do you can play the violin? — Yes, I do.', 'Can you plays the violin? — Yes, I can.', 'Are you can play the violin? — Yes, I am.']),

  // ── 18 簡單式 I/we/you/they ──
  G('g18-01', 18, 'I ___ a cup of milk every night.', ['drink', 'drinks', 'am drinking', 'drinking'], 'every night → 簡單式，I 用原形。'),
  G('g18-02', 18, 'Her grandparents ___ surf the Internet.', ['don\'t', 'doesn\'t', 'aren\'t', 'not'], '複數主詞否定用 don\'t。'),
  G('g18-03', 18, '___ you play dodgeball in PE class?', ['Do', 'Does', 'Are', 'Is'], 'you 用 Do 問。'),
  G('g18-04', 18, 'Do those girls like science class? — Yes, ___.', ['they do', 'they are', 'they like', 'she does'], 'Do 問，do 答。'),
  G('g18-05', 18, 'Jean and Sandy don\'t have ___ cellphones.', ['any', 'some', 'a', 'many of'], '否定句用 any。'),
  G('g18-06', 18, '___ do you do your homework every day? — After dinner.', ['When', 'Where', 'Who', 'How old'], '問「什麼時候」用 When。'),
  G('g18-07', 18, 'I am playing the piano now. → I ___ the piano every Thursday.', ['play', 'am play', 'plays', 'playing'], '每週的習慣用簡單式。'),
  T('g18-08', 18, 'Do you are a dentist?', false, 'be 動詞問句不用 Do：Are you a dentist?', 'Are you a dentist?'),
  T('g18-09', 18, 'Many people in Taipei take the MRT to work every day.', true, '複數主詞用原形動詞。'),
  R('g18-10', 18, '艾瑞克和我放學後打籃球。', 'Eric and I play basketball after school.'),
  R('g18-11', 18, '大部分的小孩不喜歡蔬菜。', 'Most of the children don\'t like vegetables.', 2),
  Z('g18-12', 18, '你們上體育課打躲避球嗎？', ['Do you play dodgeball in PE class?', 'Are you play dodgeball in PE class?', 'Does you play dodgeball in PE class?', 'Do you plays dodgeball in PE class?']),

  // ── 19 簡單式 he/she/it ──
  G('g19-01', 19, 'Fifi ___ jogging every Saturday afternoon.', ['goes', 'go', 'gos', 'going'], 'go → goes。'),
  G('g19-02', 19, 'Jerry ___ English in a senior high school.', ['teaches', 'teachs', 'teach', 'teaching'], 'ch 結尾加 es。'),
  G('g19-03', 19, 'My brother ___ math every evening.', ['studies', 'studys', 'study', 'studyes'], '子音＋y → ies。'),
  G('g19-04', 19, 'Derek ___ bread and coffee for breakfast every morning.', ['has', 'have', 'haves', 'having'], 'have → has。'),
  G('g19-05', 19, 'Patrick ___ like pop music.', ['doesn\'t', 'don\'t', 'isn\'t', 'not'], '第三人稱單數否定用 doesn\'t。'),
  G('g19-06', 19, 'She doesn\'t ___ long hair.', ['have', 'has', 'having', 'haves'], 'doesn\'t 後面動詞還原。'),
  G('g19-07', 19, '___ Mr. Smith drive to work? — Yes, he does.', ['Does', 'Do', 'Is', 'Can'], '第三人稱單數問句用 Does。'),
  G('g19-08', 19, 'Every student ___ to school.', ['walks', 'walk', 'walking', 'are walk'], 'every＋單數 → 第三人稱單數。', 2),
  G('g19-09', 19, 'Jerry always jogs in the park. 改成否定句：', ['Jerry doesn\'t always jog in the park.', 'Jerry doesn\'t always jogs in the park.', 'Jerry always doesn\'t jog in the park.', 'Jerry don\'t always jog in the park.'], '頻率副詞放 doesn\'t 後面，動詞還原。', 2),
  T('g19-10', 19, 'Does Sam has a small nose?', false, '用了 Does，動詞要還原：Does Sam have…?', 'Does Sam have a small nose and big ears?'),
  T('g19-11', 19, 'My grandpa doesn\'t water the flowers in the garden.', true, 'doesn\'t＋原形動詞。'),
  R('g19-12', 19, '我哥哥放學後去補習班。', 'My brother goes to cram school after school.'),
  R('g19-13', 19, '你弟弟每天踢足球嗎？', 'Does your brother play soccer every day?'),
  Z('g19-14', 19, '他太太不喝咖啡。', ['His wife doesn\'t drink coffee.', 'His wife don\'t drink coffee.', 'His wife doesn\'t drinks coffee.', 'His wife isn\'t drink coffee.']),

  // ── 20 總複習 ──
  G('g20-01', 20, 'Listen! Someone ___ happily.', ['is singing', 'sings', 'sing', 'singing'], 'Listen! → 進行式。'),
  G('g20-02', 20, 'He ___ soccer every Sunday.', ['plays', 'is playing', 'play', 'playing'], 'every Sunday → 簡單式，第三人稱加 s。'),
  G('g20-03', 20, 'Can he cook? — Yes, he ___.', ['can', 'does', 'is', 'cooks'], '用 can 問，用 can 答。'),
  G('g20-04', 20, 'Is she a nurse? — No, she ___.', ['isn\'t', 'doesn\'t', 'can\'t', 'don\'t'], 'be 動詞問，be 動詞答。'),
  G('g20-05', 20, 'Does he play soccer? — No, he ___.', ['doesn\'t', 'isn\'t', 'don\'t', 'can\'t'], 'Does 問，does 答。'),
  G('g20-06', 20, '___ sit down. 「不要坐下」', ['Don\'t', 'Doesn\'t', 'Not', 'No'], '否定祈使句：Don\'t＋原形。'),
  G('g20-07', 20, 'A: What are you doing? B: ___', ['Making a card.', 'With my mom.', 'Very happy.', 'In the park.'], '問「在做什麼」回答動作。'),
  G('g20-08', 20, 'Are you playing computer games? — Yes, ___.', ['I am', 'I\'m playing', 'I do', 'we do'], '肯定簡答 Yes, I am.'),
  G('g20-09', 20, 'The singer ___ kisses and singing on the stage.', ['is blowing', 'blow', 'blows', 'blowing'], '進行式：is＋V-ing … and singing。', 2),
  G('g20-10', 20, 'Lisa is drawing a picture. 依畫線 drawing a picture 造問句：', ['What is Lisa doing?', 'What does Lisa do?', 'What is Lisa draw?', 'What Lisa is doing?'], '問「正在做什麼」：What is…doing?'),
  T('g20-11', 20, 'Everyone is having a good time.', true, 'everyone 當單數。'),
  T('g20-12', 20, 'She can sings very well.', false, 'can 後面用原形動詞。', 'She can sing very well.'),
  R('g20-13', 20, '粉絲們正在排隊等他們最喜歡的樂團。', 'Fans are waiting in line for their favorite band.', 2),
  Z('g20-14', 20, '我每天晚上洗澡。（改成「現在正在洗澡」）', ['I am taking a shower now.', 'I take a shower now.', 'I am take a shower now.', 'I taking a shower now.']),
);

// ═════════ 單字題（由 VOCAB_UNITS 自動產生）═════════
// 分三級（孩子答對率高時 App 會自動提高難度，見 app.js 的 diffLevel）：
//   ★ 基礎：看英文選中文、看中文選英文、聽發音選單字、字母方塊拼字（干擾字母挑「長得像、容易搞混」的）
//   ★★ 進階（lv 2）：挖空填字母、聽發音拼字、例句填空
//   ★★★ 挑戰（lv 3）：看中文把整個字寫出來（6 個字母以內用手寫、長的用打字）、聽寫（聽發音打出來）
(function makeVocab() {
  const all = VOCAB_UNITS.flatMap((u, i) => u.words.map(w => ({ ch: i + 1, w: w[0], zh: w[1], ex: w[2], exZh: w[3] })));
  const slug = w => w.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const mix = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);
  // 干擾選項：先找同一關的字，不夠再從全部挑；選項不重複
  function others(x, key, n, filter = () => true) {
    const pool = [...mix(all.filter(y => y.ch === x.ch && y !== x && filter(y))), ...mix(all.filter(y => y.ch !== x.ch && filter(y)))];
    const out = [];
    for (const y of pool) { if (out.length >= n) break; if (y[key] !== x[key] && !out.includes(y[key])) out.push(y[key]); }
    return out;
  }
  const looksLike = x => y => y.w[0].toLowerCase() === x.w[0].toLowerCase() || Math.abs(y.w.length - x.w.length) <= 1;
  // 容易搞混的字母（b/d/p/q、m/n、i/e/l、c/k/s…）
  const CONF = { a: 'eou', b: 'dpq', c: 'ksz', d: 'bpq', e: 'aio', f: 'tv', g: 'jqy', h: 'nk', i: 'ejly', j: 'gi', k: 'ch', l: 'it', m: 'nw', n: 'mhu', o: 'aeu', p: 'bdq', q: 'gp', r: 'nl', s: 'cz', t: 'fl', u: 'vnw', v: 'uw', w: 'vm', x: 'zk', y: 'ig', z: 'sx' };
  // 干擾字母：一個「多出來的重複字母」（考雙寫）＋幾個易混字母
  function decoys(letters, n) {
    const low = letters.map(c => c.toLowerCase());
    const out = [mix(low)[0]];
    const cand = mix([...new Set(low.flatMap(c => [...(CONF[c] || '')]))].filter(c => !low.includes(c)));
    for (const c of cand) { if (out.length >= n) break; out.push(c); }
    while (out.length < n) out.push(mix([...'aeioustnrl'])[0]);
    return out;
  }
  for (const x of all) {
    const id = `v-${slug(x.w)}`;
    const base = { s: 'voc', ch: x.ch, word: x.w, e: `${x.w} ＝ ${x.zh}` };
    const ex = x.ex ? { say: x.ex, sayZh: x.exZh } : {};
    const letters = /^[a-z]{3,10}$/i.test(x.w); // 純字母、3～10 個字母的字才出拼字題
    // ── ★ 基礎 ──
    BANK.push({ ...base, ...ex, id: `${id}-1`, t: 'mc', q: `「${x.w}」是什麼意思？`, o: [x.zh, ...others(x, 'zh', 3)], a: 0 });
    BANK.push({ ...base, ...ex, id: `${id}-2`, t: 'mc', q: `「${x.zh}」的英文是？`, o: [x.w, ...others(x, 'w', 3)], a: 0 });
    BANK.push({ ...base, ...ex, id: `${id}-3`, t: 'mc', q: '🎧 聽發音，選出正確的單字', listen: x.w, o: [x.w, ...others(x, 'w', 3, looksLike(x))], a: 0 });
    if (letters) BANK.push({ ...base, ...ex, id: `${id}-4`, t: 'order', join: '', q: `🔤 拼出「${x.zh}」的英文`, o: [...x.w], extra: decoys([...x.w], x.w.length > 6 ? 4 : 3) });
    // ── ★★ 進階 ──
    if (x.ex) { // 例句填空：例句裡要真的出現這個字
      const re = new RegExp(`\\b${x.w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (re.test(x.ex)) BANK.push({ ...base, ...ex, id: `${id}-5`, t: 'mc', q: `📝 填入正確的單字：\n${x.ex.replace(re, '_____')}\n（${x.exZh}）`, o: [x.w, ...others(x, 'w', 3)], a: 0, lv: 2 });
    }
    if (letters && x.w.length >= 4) { // 挖空填字母：第一個字母保留，挖掉約 4 成
      const idx = mix([...x.w].map((_, i) => i).slice(1)).slice(0, Math.max(2, Math.round(x.w.length * 0.4))).sort((a, b) => a - b);
      const shown = [...x.w].map((c, i) => (idx.includes(i) ? '＿' : c)).join(' ');
      const miss = idx.map(i => x.w[i]);
      BANK.push({ ...base, ...ex, id: `${id}-6`, t: 'order', join: '', full: x.w, q: `🧩 補上缺少的字母：「${x.zh}」\n${shown}`, o: miss, extra: decoys(miss, 2), lv: 2 });
    }
    if (letters) BANK.push({ ...base, ...ex, id: `${id}-7`, t: 'order', join: '', q: `🎧 聽發音，拼出這個單字`, listen: x.w, o: [...x.w], extra: decoys([...x.w], 3), lv: 2 });
    // ── ★★★ 挑戰 ──
    if (letters && x.w.length <= 6) BANK.push({ ...base, ...ex, id: `${id}-8`, t: 'write', en: true, q: `✍️ 用手寫寫出「${x.zh}」的英文`, w: x.w, lv: 3 });
    else BANK.push({ ...base, ...ex, id: `${id}-8`, t: 'type', q: `⌨️ 打出「${x.zh}」的英文`, w: x.w, lv: 3 });
    BANK.push({ ...base, ...ex, id: `${id}-9`, t: 'type', q: '🎧 聽寫：聽發音，打出這個英文', listen: x.w, w: x.w, lv: 3 });
  }
})();
