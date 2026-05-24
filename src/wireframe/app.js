const app = document.querySelector("#app");
const backButton = document.querySelector("#backButton");

const PERSON_NAMES_API_URL = window.PERSON_NAMES_API_URL
  || "https://asia-northeast1-orepasystem-343204.cloudfunctions.net/district-night-name-input";

function requestJson(url, options) {
  const opts = options || {};
  if (typeof fetch === "function") {
    return fetch(url, opts).then((response) => {
      if (!response.ok) throw new Error(`person names ${opts.method || "GET"} failed: ${response.status}`);
      return response.json();
    });
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(opts.method || "GET", url, true);
    if (opts.headers) {
      for (const [key, value] of Object.entries(opts.headers)) xhr.setRequestHeader(key, value);
    }
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) return;
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`person names ${opts.method || "GET"} failed: ${xhr.status}`));
        return;
      }
      try {
        resolve(JSON.parse(xhr.responseText || "{}"));
      } catch (err) {
        reject(err);
      }
    };
    xhr.onerror = () => reject(new Error("person names request failed"));
    xhr.send(opts.body || null);
  });
}

/* ── Agenda with presenters (xlsx 次第 sheet) ── */

const agendaItems = [
  { time: "17:00", program: "受付", presenter: "" },
  { time: "17:45", program: "開場", presenter: "" },
  { time: "18:00", program: "開会", presenter: "" },
  { time: "18:01", program: "開会の辞", presenter: "鈴木仁志 地区副幹事" },
  { time: "18:03", program: "ガバナー挨拶", presenter: "鈴木康仁 ガバナー" },
  { time: "18:07", program: "特別出席者の紹介", presenter: "小池高弘 地区幹事" },
  { time: "18:11", program: "乾杯", presenter: "篭橋美久 パストガバナー" },
  { time: "18:15", program: "獅子舞の舞", presenter: "" },
  { time: "18:20", program: "〜 歓談 〜", presenter: "" },
  { time: "18:30", program: "１年を振り返って(映像)", presenter: "" },
  { time: "18:50", program: "〜 歓談 〜", presenter: "" },
  { time: "19:00", program: "アトラクション", presenter: "" },
  { time: "19:40", program: "〜 歓談 〜", presenter: "" },
  { time: "19:51", program: "ガバナーエレクト挨拶", presenter: "國府谷俊盛 ガバナーエレクト" },
  { time: "19:55", program: "締めの挨拶", presenter: "吉川公章 直前ガバナー" },
  { time: "19:59", program: "閉会の辞", presenter: "鈴木康仁 地区副幹事" },
  { time: "20:00", program: "閉会", presenter: "" },
];

/* ── Club/name → Table → Seats (0520 レイアウト詳細, excluding personal-name tables 2-4) ── */

const clubSeating = {
  "愛知三州": {"38":[6,7,8,9,10]},
  "愛知長久手": {"20":[1,2,3,4,5,6],"26":[1,2,3,4,5]},
  "渥美": {"57":[6,7,8,9,10]},
  "あま": {"19":[3,4]},
  "一宮中央": {"23":[1,2,3,4,5,6,7,8]},
  "稲沢": {"10":[1,2,3,4,5,6,7,8]},
  "犬山": {"22":[1,2,3,4,5,6,7,8,9,10],"28":[1,2]},
  "岩倉": {"28":[5,6,7,8,9,10]},
  "岡崎": {"25":[1,2,3,4,5,6,7,8,9,10],"31":[1,2,3,4,5,6,7,8,9]},
  "岡崎南": {"29":[1,2,3,4,5,6,7]},
  "尾張旭": {"23":[9,10]},
  "尾張中央": {"5":[4,5,6,7,8,9,10],"11":[1,2,3,4,5,6,7,8,9,10]},
  "蒲郡": {"S1":[1,2,3,4,5,6,7,8,9,10],"S2":[1,2,3,4,5,6,7,8,9,10],"S3":[1,2,3,4,5,6,7,8,9,10],"S4":[1,2,3,4,5,6,7,8,9,10],"S5":[1,2,3,4,5,6,7,8,9,10]},
  "春日井": {"36":[1,2,3,4,5],"42":[1,2,3,4,5,6]},
  "刈谷": {"44":[1,2,3,4,5]},
  "江南": {"16":[5,6,7,8,9,10]},
  "小牧": {"28":[3,4]},
  "新城": {"43":[10]},
  "瀬戸": {"16":[1,2,3,4],"17":[1,2,3,4,5,6,7,8,9,10]},
  "瀬戸北": {"9":[6,7,8,9],"10":[9,10],"15":[7,8,9,10],"21":[1,2,3,4,5,6,7,8,9,10],"27":[1,2,3,4]},
  "高浜": {"35":[6,7,8,9,10],"41":[5,6,7,8,9,10]},
  "田原": {"57":[2,3,4,5]},
  "田原パシフィック": {"47":[8,9,10]},
  "知立": {"46":[8,9,10],"51":[1,2,3,4,5,6,7,8,9,10],"52":[1,2,3,4,5,6,7,8,9,10]},
  "豊川": {"53":[1,2,3,4,5,6,7,8,9,10]},
  "豊川宝飯": {"56":[1,2,3,4,5,6,7]},
  "豐田": {"32":[1,2,3,4,5,6,7,8,9,10],"37":[1,2,3,4,5,6,7],"38":[1,2,3,4,5],"43":[1,2,3,4,5,6,7,8,9]},
  "豊田中": {"37":[8,9,10]},
  "豊田西": {"33":[1,2,3,4,5,6,7],"34":[1,2,3,4,5,6,7,8,9,10]},
  "豐田東": {"31":[10]},
  "豊田三好": {"33":[8,9,10]},
  "豊橋": {"49":[1,2,3,4,5,6,7,8,9,10],"50":[1,2,3,4,5,6,7,8,9,10],"54":[1,2,3,4,5,6],"55":[1,2,3,4,5]},
  "豊橋北": {"57":[1]},
  "豊橋東": {"56":[8,9,10]},
  "豊橋南": {"54":[7,8,9,10],"55":[6,7,8,9,10]},
  "名古屋アイリス": {"26":[10]},
  "名古屋北": {"14":[1,2,3]},
  "名古屋清須": {"1":[8]},
  "名古屋空港": {"9":[1,2,3,4,5],"15":[1,2,3,4,5,6]},
  "名古屋栄": {"1":[1,2,3,4]},
  "名古屋城北": {"27":[5,6,7,8,9,10]},
  "名古屋昭和": {"19":[9,10]},
  "名古屋千種": {"45":[1,2,3,4,5,6,7,8,9,10],"46":[1,2,3,4,5,6,7]},
  "名古屋東南": {"24":[7,8,9,10],"30":[1,2,3,4,5,6,7,8,9,10]},
  "名古屋中": {"18":[6,7,8,9,10]},
  "名古屋錦": {"19":[5],"48":[6,7,8,9,10]},
  "名古屋東": {"13":[1,2,3,4,5,6,7,8,9,10],"14":[4,5,6,7,8,9,10]},
  "名古屋東山": {"19":[6]},
  "名古屋瑞穂": {"19":[1,2]},
  "名古屋みなと": {"18":[1,2,3,4,5],"24":[1,2,3,4,5,6]},
  "名古屋南": {"1":[5,6,7],"6":[1,2,3,4,5,6,7,8,9,10],"7":[1,2,3,4,5,6,7,8,9,10],"12":[1,2,3,4,5,6,7,8,9,10]},
  "名古屋名駅": {"8":[1,2,3,4,5,6,7,8,9,10]},
  "名古屋名東": {"47":[1,2,3,4,5,6,7]},
  "名古屋名北": {"19":[7,8]},
  "名古屋守山": {"36":[6,7,8,9,10],"42":[7,8,9,10],"48":[1,2,3,4,5]},
  "名古屋和合": {"20":[7,8,9,10],"26":[6,7,8,9]},
  "西尾": {"39":[1,2,3,4,5,6],"40":[1,2,3,4,5,6,7,8,9,10],"44":[6,7,8,9,10]},
  "西尾一色": {"29":[8,9,10],"35":[1,2,3,4,5],"41":[1,2,3,4]},
  "西尾KIRARA": {"39":[7,8,9,10]},
  "半田": {"1":[9,10],"5":[1,2]},
  "半田南": {"5":[3]},
  "東知多": {"9":[10]},
};

const japaneseCollator = new Intl.Collator("ja", { usage: "sort", sensitivity: "base", numeric: true });

const clubNameReadings = {
  "愛知三州": "あいちさんしゅう",
  "愛知長久手": "あいちながくて",
  "渥美": "あつみ",
  "あま": "あま",
  "一宮中央": "いちのみやちゅうおう",
  "稲沢": "いなざわ",
  "犬山": "いぬやま",
  "岩倉": "いわくら",
  "岡崎": "おかざき",
  "岡崎南": "おかざきみなみ",
  "尾張旭": "おわりあさひ",
  "尾張中央": "おわりちゅうおう",
  "春日井": "かすがい",
  "蒲郡": "がまごおり",
  "刈谷": "かりや",
  "基隆南": "きいるんみなみ",
  "江南": "こうなん",
  "小牧": "こまき",
  "小松": "こまつ",
  "新城": "しんしろ",
  "瀬戸": "せと",
  "瀬戸北": "せときた",
  "高浜": "たかはま",
  "田原": "たはら",
  "田原パシフィック": "たはらぱしふぃっく",
  "知立": "ちりゅう",
  "豊川": "とよかわ",
  "豊川宝飯": "とよかわほい",
  "豐田": "とよた",
  "豊田中": "とよたなか",
  "豊田西": "とよたにし",
  "豐田東": "とよたひがし",
  "豊田三好": "とよたみよし",
  "豊橋": "とよはし",
  "豊橋北": "とよはしきた",
  "豊橋東": "とよはしひがし",
  "豊橋南": "とよはしみなみ",
  "名古屋アイリス": "なごやあいりす",
  "名古屋北": "なごやきた",
  "名古屋清須": "なごやきよす",
  "名古屋空港": "なごやくうこう",
  "名古屋栄": "なごやさかえ",
  "名古屋城北": "なごやじょうほく",
  "名古屋昭和": "なごやしょうわ",
  "名古屋千種": "なごやちくさ",
  "名古屋東南": "なごやとうなん",
  "名古屋中": "なごやなか",
  "名古屋錦": "なごやにしき",
  "名古屋東": "なごやひがし",
  "名古屋東山": "なごやひがしやま",
  "名古屋瑞穂": "なごやみずほ",
  "名古屋みなと": "なごやみなと",
  "名古屋南": "なごやみなみ",
  "名古屋名駅": "なごやめいえき",
  "名古屋名東": "なごやめいとう",
  "名古屋名北": "なごやめいほく",
  "名古屋守山": "なごやもりやま",
  "名古屋和合": "なごやわごう",
  "西尾": "にしお",
  "西尾一色": "にしおいっしき",
  "西尾KIRARA": "にしおきらら",
  "半田": "はんだ",
  "半田南": "はんだみなみ",
  "東知多": "ひがしちた",
};

function clubNameSortKey(name) {
  if (name === "あま") return "ああま";
  return clubNameReadings[name] || name;
}

function sortClubNames(names) {
  return [...names].sort((a, b) => {
    const byReading = japaneseCollator.compare(clubNameSortKey(a), clubNameSortKey(b));
    return byReading || japaneseCollator.compare(a, b);
  });
}

/* ── Reverse map: table → [{club, seats}] ── */

const tableToClubs = {};
for (const [club, tables] of Object.entries(clubSeating)) {
  for (const [tbl, seats] of Object.entries(tables)) {
    if (!tableToClubs[tbl]) tableToClubs[tbl] = [];
    tableToClubs[tbl].push({ club, seats });
  }
}

function seatAffiliation(row) {
  return row.club || row.affiliation || row.name || "";
}

function seatPerson(row) {
  return row.personName || row.person || "";
}

function seatSearchText(row, tableId) {
  const parts = [seatAffiliation(row), seatPerson(row)];
  if (tableId) parts.push(String(tableId), `${tableId}番`);
  return parts.filter(Boolean).join(" ");
}

function memberRowHtml(row, tableId) {
  const affiliation = seatAffiliation(row);
  const person = seatPerson(row);
  const tbl = tableId || row._tableId || "";
  const checked = tbl && isCheckedIn(tbl, row.seat);
  return `
    <div class="mg-row${checked ? " is-checked-in" : ""}">
      <span class="mg-seat-num">${row.seat}</span>
      <span class="mg-row-main">
        <span class="mg-row-name">${escapeHtml(affiliation)}</span>
        ${person ? `<span class="mg-row-person">${escapeHtml(person)}</span>` : ""}
      </span>
      ${checked ? `<span class="check-mark"></span>` : ""}
    </div>`;
}

function venueSeatLabel(row) {
  const affiliation = seatAffiliation(row);
  const person = seatPerson(row);
  return person ? `${affiliation} ${person}` : affiliation;
}

/* ── Food menu ── */

const foodMenu = [
  {
    course: "前菜盛合せ",
    items: [
      { zh: "剥皮辣椒鶏捲", ja: "ピーマンと鶏肉の巻き物" },
      { zh: "酸豆鮭魚捲", ja: "ケッパーとサーモンの巻き物" },
      { zh: "閩式醬白玉", ja: "福建風白玉団子" },
      { zh: "蘋果脆筒烏魚子", ja: "リンゴとカラスミのクリスピー" },
      { zh: "莎莎醬干貝", ja: "帆立のサルサソース" },
      { zh: "煙燻松阪豬", ja: "スモークポーク" },
    ],
  },
  { zh: "黃晶凍鮑魚沙拉", ja: "アワビのクリスタルゼリーサラダ" },
  { zh: "金絲銀蒜海大蝦", ja: "車海老のにんにく蒸し" },
  { zh: "紫荊九環爆雙鮮", ja: "特製ソース海鮮炒め" },
  { zh: "紐西蘭犢牛佐爐烤蔬菜", ja: "ニュージーランド産牛肉と野菜のオーブン焼き" },
  { zh: "海底椰蘋果燉雞湯", ja: "鶏肉の煮込みスープ" },
  { zh: "欖鼓醬清蒸石斑魚菲力", ja: "ハタのオリーブ特製ソース蒸し" },
  { zh: "圓山荷葉糯米飯", ja: "圓山風ちまき" },
  { zh: "有機豆漿燉雪燕", ja: "ツバメの巣入り豆乳スープ" },
  { zh: "環宇繽紛水果盤", ja: "季節のフルーツ" },
];

/* ── Drinks with Chinese names (5 ウイスキー removed, renumbered 1-13) ── */

const drinkItems = [
  { num: 1, ja: "台湾ビール", zh: "台灣啤酒", cat: "alcohol" },
  { num: 2, ja: "白ワイン", zh: "白葡萄酒", cat: "alcohol" },
  { num: 3, ja: "赤ワイン", zh: "紅葡萄酒", cat: "alcohol" },
  { num: 4, ja: "紹興酒", zh: "紹興酒", cat: "alcohol" },
  { num: 5, ja: "水割り（普通）", zh: "威士忌加水（普通）", cat: "whiskey" },
  { num: 6, ja: "水割り（薄い）", zh: "威士忌加水（淡一點）", cat: "whiskey" },
  { num: 7, ja: "水割り（濃い）", zh: "威士忌加水（濃一點）", cat: "whiskey" },
  { num: 8, ja: "ハイボール（普通）", zh: "威士忌蘇打（普通）", cat: "whiskey" },
  { num: 9, ja: "ハイボール（薄い）", zh: "威士忌蘇打（淡一點）", cat: "whiskey" },
  { num: 10, ja: "ハイボール（濃い）", zh: "威士忌蘇打（濃一點）", cat: "whiskey" },
  { num: 11, ja: "ロック", zh: "威士忌加冰", cat: "whiskey" },
  { num: 12, ja: "ウーロン茶", zh: "烏龍茶", cat: "soft" },
  { num: 13, ja: "オレンジジュース", zh: "柳橙汁", cat: "soft" },
];

const drinkCategories = [
  { key: "alcohol", label: "アルコール" },
  { key: "whiskey", label: "ウイスキー" },
  { key: "soft", label: "ソフトドリンク" },
];

/* ── Table rows from 0520 レイアウト詳細 (member/table display source) ── */

const specialTableData = {
  "1": [
    { seat: 1, name: "名古屋栄" },
    { seat: 2, name: "名古屋栄" },
    { seat: 3, name: "名古屋栄" },
    { seat: 4, name: "名古屋栄" },
    { seat: 5, name: "名古屋南" },
    { seat: 6, name: "名古屋南" },
    { seat: 7, name: "名古屋南" },
    { seat: 8, name: "名古屋清須" },
    { seat: 9, name: "半田" },
    { seat: 10, name: "半田" },
  ],
  "2": [
    { seat: 1, name: "田中正規PDG" },
    { seat: 2, name: "田中靖子PDG" },
    { seat: 3, name: "田中佐知PDGご令嬢" },
    { seat: 4, name: "永井恭子DGN夫人" },
    { seat: 5, name: "永井伸治DGN" },
    { seat: 6, name: "金森貴史DSN" },
    { seat: 7, name: "峰澤彰宏DGND" },
    { seat: 8, name: "村井麻葉PDGご令嬢" },
    { seat: 9, name: "村井康子PDG夫人" },
    { seat: 10, name: "村井總一郎PDG" },
  ],
  "3": [
    { seat: 1, name: "鈴木康仁DG" },
    { seat: 2, name: "鈴木佐千江DG夫人" },
    { seat: 3, name: "篭橋美久PDG" },
    { seat: 4, name: "篭橋香代子PDG夫人" },
    { seat: 5, name: "岡部つとむPDG" },
    { seat: 6, name: "岡部理恵PDG夫人" },
    { seat: 7, name: "酒井法丈PDG" },
    { seat: 8, name: "吉川公章PDG" },
    { seat: 9, name: "吉川トモ子PDG夫人" },
    { seat: 10, name: "山田哲也DSE" },
    { seat: 11, name: "國府谷眞知子DGE夫人" },
    { seat: 12, name: "國府谷俊盛DGE" },
    { seat: 13, name: "伊藤靖祐PDG" },
    { seat: 14, name: "神野重行PDG" },
  ],
  "4": [
    { seat: 1, name: "伊東良夫AG" },
    { seat: 2, name: "伊東尚子AG夫人" },
    { seat: 3, name: "大竹敬一AG" },
    { seat: 4, name: "青山 稔AG" },
    { seat: 5, name: "小池高弘地DS" },
    { seat: 6, name: "牧 功AG" },
    { seat: 7, name: "金田淳江AG夫人" },
    { seat: 8, name: "金田英和AG" },
    { seat: 9, name: "倉田良子AG夫人" },
    { seat: 10, name: "倉田英行AG" },
  ],
  "5": [
    { seat: 1, name: "半田" },
    { seat: 2, name: "半田" },
    { seat: 3, name: "半田南" },
    { seat: 4, name: "尾張中央" },
    { seat: 5, name: "尾張中央" },
    { seat: 6, name: "尾張中央" },
    { seat: 7, name: "尾張中央" },
    { seat: 8, name: "尾張中央" },
    { seat: 9, name: "尾張中央" },
    { seat: 10, name: "尾張中央" },
  ],
  "6": [
    { seat: 1, name: "名古屋南" },
    { seat: 2, name: "名古屋南" },
    { seat: 3, name: "名古屋南" },
    { seat: 4, name: "名古屋南" },
    { seat: 5, name: "名古屋南" },
    { seat: 6, name: "名古屋南" },
    { seat: 7, name: "名古屋南" },
    { seat: 8, name: "名古屋南" },
    { seat: 9, name: "名古屋南" },
    { seat: 10, name: "名古屋南" },
  ],
  "7": [
    { seat: 1, name: "名古屋南" },
    { seat: 2, name: "名古屋南" },
    { seat: 3, name: "名古屋南" },
    { seat: 4, name: "名古屋南" },
    { seat: 5, name: "名古屋南" },
    { seat: 6, name: "名古屋南" },
    { seat: 7, name: "名古屋南" },
    { seat: 8, name: "名古屋南" },
    { seat: 9, name: "名古屋南" },
    { seat: 10, name: "名古屋南" },
  ],
  "8": [
    { seat: 1, name: "名古屋名駅" },
    { seat: 2, name: "名古屋名駅" },
    { seat: 3, name: "名古屋名駅" },
    { seat: 4, name: "名古屋名駅" },
    { seat: 5, name: "名古屋名駅" },
    { seat: 6, name: "名古屋名駅" },
    { seat: 7, name: "名古屋名駅" },
    { seat: 8, name: "名古屋名駅" },
    { seat: 9, name: "名古屋名駅" },
    { seat: 10, name: "名古屋名駅" },
  ],
  "9": [
    { seat: 1, name: "名古屋空港" },
    { seat: 2, name: "名古屋空港" },
    { seat: 3, name: "名古屋空港" },
    { seat: 4, name: "名古屋空港" },
    { seat: 5, name: "名古屋空港" },
    { seat: 6, name: "瀬戸北" },
    { seat: 7, name: "瀬戸北" },
    { seat: 8, name: "瀬戸北" },
    { seat: 9, name: "瀬戸北" },
    { seat: 10, name: "東知多" },
  ],
  "10": [
    { seat: 1, name: "稲沢" },
    { seat: 2, name: "稲沢" },
    { seat: 3, name: "稲沢" },
    { seat: 4, name: "稲沢" },
    { seat: 5, name: "稲沢" },
    { seat: 6, name: "稲沢" },
    { seat: 7, name: "稲沢" },
    { seat: 8, name: "稲沢" },
    { seat: 9, name: "瀬戸北" },
    { seat: 10, name: "瀬戸北" },
  ],
  "11": [
    { seat: 1, name: "尾張中央" },
    { seat: 2, name: "尾張中央" },
    { seat: 3, name: "尾張中央" },
    { seat: 4, name: "尾張中央" },
    { seat: 5, name: "尾張中央" },
    { seat: 6, name: "尾張中央" },
    { seat: 7, name: "尾張中央" },
    { seat: 8, name: "尾張中央" },
    { seat: 9, name: "尾張中央" },
    { seat: 10, name: "尾張中央" },
  ],
  "12": [
    { seat: 1, name: "名古屋南" },
    { seat: 2, name: "名古屋南" },
    { seat: 3, name: "名古屋南" },
    { seat: 4, name: "名古屋南" },
    { seat: 5, name: "名古屋南" },
    { seat: 6, name: "名古屋南" },
    { seat: 7, name: "名古屋南" },
    { seat: 8, name: "名古屋南" },
    { seat: 9, name: "名古屋南" },
    { seat: 10, name: "名古屋南" },
  ],
  "13": [
    { seat: 1, name: "名古屋東" },
    { seat: 2, name: "名古屋東" },
    { seat: 3, name: "名古屋東" },
    { seat: 4, name: "名古屋東" },
    { seat: 5, name: "名古屋東" },
    { seat: 6, name: "名古屋東" },
    { seat: 7, name: "名古屋東" },
    { seat: 8, name: "名古屋東" },
    { seat: 9, name: "名古屋東" },
    { seat: 10, name: "名古屋東" },
  ],
  "14": [
    { seat: 1, name: "名古屋北" },
    { seat: 2, name: "名古屋北" },
    { seat: 3, name: "名古屋北" },
    { seat: 4, name: "名古屋東" },
    { seat: 5, name: "名古屋東" },
    { seat: 6, name: "名古屋東" },
    { seat: 7, name: "名古屋東" },
    { seat: 8, name: "名古屋東" },
    { seat: 9, name: "名古屋東" },
    { seat: 10, name: "名古屋東" },
  ],
  "15": [
    { seat: 1, name: "名古屋空港" },
    { seat: 2, name: "名古屋空港" },
    { seat: 3, name: "名古屋空港" },
    { seat: 4, name: "名古屋空港" },
    { seat: 5, name: "名古屋空港" },
    { seat: 6, name: "名古屋空港" },
    { seat: 7, name: "瀬戸北" },
    { seat: 8, name: "瀬戸北" },
    { seat: 9, name: "瀬戸北" },
    { seat: 10, name: "瀬戸北" },
  ],
  "16": [
    { seat: 1, name: "瀬戸" },
    { seat: 2, name: "瀬戸" },
    { seat: 3, name: "瀬戸" },
    { seat: 4, name: "瀬戸" },
    { seat: 5, name: "江南" },
    { seat: 6, name: "江南" },
    { seat: 7, name: "江南" },
    { seat: 8, name: "江南" },
    { seat: 9, name: "江南" },
    { seat: 10, name: "江南" },
  ],
  "17": [
    { seat: 1, name: "瀬戸" },
    { seat: 2, name: "瀬戸" },
    { seat: 3, name: "瀬戸" },
    { seat: 4, name: "瀬戸" },
    { seat: 5, name: "瀬戸" },
    { seat: 6, name: "瀬戸" },
    { seat: 7, name: "瀬戸" },
    { seat: 8, name: "瀬戸" },
    { seat: 9, name: "瀬戸" },
    { seat: 10, name: "瀬戸" },
  ],
  "18": [
    { seat: 1, name: "名古屋みなと" },
    { seat: 2, name: "名古屋みなと" },
    { seat: 3, name: "名古屋みなと" },
    { seat: 4, name: "名古屋みなと" },
    { seat: 5, name: "名古屋みなと" },
    { seat: 6, name: "名古屋中" },
    { seat: 7, name: "名古屋中" },
    { seat: 8, name: "名古屋中" },
    { seat: 9, name: "名古屋中" },
    { seat: 10, name: "名古屋中" },
  ],
  "19": [
    { seat: 1, name: "名古屋瑞穂" },
    { seat: 2, name: "名古屋瑞穂" },
    { seat: 3, name: "あま" },
    { seat: 4, name: "あま" },
    { seat: 5, name: "名古屋錦" },
    { seat: 6, name: "名古屋東山" },
    { seat: 7, name: "名古屋名北" },
    { seat: 8, name: "名古屋名北" },
    { seat: 9, name: "名古屋昭和" },
    { seat: 10, name: "名古屋昭和" },
  ],
  "20": [
    { seat: 1, name: "愛知長久手" },
    { seat: 2, name: "愛知長久手" },
    { seat: 3, name: "愛知長久手" },
    { seat: 4, name: "愛知長久手" },
    { seat: 5, name: "愛知長久手" },
    { seat: 6, name: "愛知長久手" },
    { seat: 7, name: "名古屋和合" },
    { seat: 8, name: "名古屋和合" },
    { seat: 9, name: "名古屋和合" },
    { seat: 10, name: "名古屋和合" },
  ],
  "21": [
    { seat: 1, name: "瀬戸北" },
    { seat: 2, name: "瀬戸北" },
    { seat: 3, name: "瀬戸北" },
    { seat: 4, name: "瀬戸北" },
    { seat: 5, name: "瀬戸北" },
    { seat: 6, name: "瀬戸北" },
    { seat: 7, name: "瀬戸北" },
    { seat: 8, name: "瀬戸北" },
    { seat: 9, name: "瀬戸北" },
    { seat: 10, name: "瀬戸北" },
  ],
  "22": [
    { seat: 1, name: "犬山" },
    { seat: 2, name: "犬山" },
    { seat: 3, name: "犬山" },
    { seat: 4, name: "犬山" },
    { seat: 5, name: "犬山" },
    { seat: 6, name: "犬山" },
    { seat: 7, name: "犬山" },
    { seat: 8, name: "犬山" },
    { seat: 9, name: "犬山" },
    { seat: 10, name: "犬山" },
  ],
  "23": [
    { seat: 1, name: "一宮中央" },
    { seat: 2, name: "一宮中央" },
    { seat: 3, name: "一宮中央" },
    { seat: 4, name: "一宮中央" },
    { seat: 5, name: "一宮中央" },
    { seat: 6, name: "一宮中央" },
    { seat: 7, name: "一宮中央" },
    { seat: 8, name: "一宮中央" },
    { seat: 9, name: "尾張旭" },
    { seat: 10, name: "尾張旭" },
  ],
  "24": [
    { seat: 1, name: "名古屋みなと" },
    { seat: 2, name: "名古屋みなと" },
    { seat: 3, name: "名古屋みなと" },
    { seat: 4, name: "名古屋みなと" },
    { seat: 5, name: "名古屋みなと" },
    { seat: 6, name: "名古屋みなと" },
    { seat: 7, name: "名古屋東南" },
    { seat: 8, name: "名古屋東南" },
    { seat: 9, name: "名古屋東南" },
    { seat: 10, name: "名古屋東南" },
  ],
  "25": [
    { seat: 1, name: "岡崎" },
    { seat: 2, name: "岡崎" },
    { seat: 3, name: "岡崎" },
    { seat: 4, name: "岡崎" },
    { seat: 5, name: "岡崎" },
    { seat: 6, name: "岡崎" },
    { seat: 7, name: "岡崎" },
    { seat: 8, name: "岡崎" },
    { seat: 9, name: "岡崎" },
    { seat: 10, name: "岡崎" },
  ],
  "26": [
    { seat: 1, name: "愛知長久手" },
    { seat: 2, name: "愛知長久手" },
    { seat: 3, name: "愛知長久手" },
    { seat: 4, name: "愛知長久手" },
    { seat: 5, name: "愛知長久手" },
    { seat: 6, name: "名古屋和合" },
    { seat: 7, name: "名古屋和合" },
    { seat: 8, name: "名古屋和合" },
    { seat: 9, name: "名古屋和合" },
    { seat: 10, name: "名古屋アイリス" },
  ],
  "27": [
    { seat: 1, name: "瀬戸北" },
    { seat: 2, name: "瀬戸北" },
    { seat: 3, name: "瀬戸北" },
    { seat: 4, name: "瀬戸北" },
    { seat: 5, name: "名古屋城北" },
    { seat: 6, name: "名古屋城北" },
    { seat: 7, name: "名古屋城北" },
    { seat: 8, name: "名古屋城北" },
    { seat: 9, name: "名古屋城北" },
    { seat: 10, name: "名古屋城北" },
  ],
  "28": [
    { seat: 1, name: "犬山" },
    { seat: 2, name: "犬山" },
    { seat: 3, name: "小牧" },
    { seat: 4, name: "小牧" },
    { seat: 5, name: "岩倉" },
    { seat: 6, name: "岩倉" },
    { seat: 7, name: "岩倉" },
    { seat: 8, name: "岩倉" },
    { seat: 9, name: "岩倉" },
    { seat: 10, name: "岩倉" },
  ],
  "29": [
    { seat: 1, name: "岡崎南" },
    { seat: 2, name: "岡崎南" },
    { seat: 3, name: "岡崎南" },
    { seat: 4, name: "岡崎南" },
    { seat: 5, name: "岡崎南" },
    { seat: 6, name: "岡崎南" },
    { seat: 7, name: "岡崎南" },
    { seat: 8, name: "西尾一色" },
    { seat: 9, name: "西尾一色" },
    { seat: 10, name: "西尾一色" },
  ],
  "30": [
    { seat: 1, name: "名古屋東南" },
    { seat: 2, name: "名古屋東南" },
    { seat: 3, name: "名古屋東南" },
    { seat: 4, name: "名古屋東南" },
    { seat: 5, name: "名古屋東南" },
    { seat: 6, name: "名古屋東南" },
    { seat: 7, name: "名古屋東南" },
    { seat: 8, name: "名古屋東南" },
    { seat: 9, name: "名古屋東南" },
    { seat: 10, name: "名古屋東南" },
  ],
  "31": [
    { seat: 1, name: "岡崎" },
    { seat: 2, name: "岡崎" },
    { seat: 3, name: "岡崎" },
    { seat: 4, name: "岡崎" },
    { seat: 5, name: "岡崎" },
    { seat: 6, name: "岡崎" },
    { seat: 7, name: "岡崎" },
    { seat: 8, name: "岡崎" },
    { seat: 9, name: "岡崎" },
    { seat: 10, name: "豐田東" },
  ],
  "32": [
    { seat: 1, name: "豐田" },
    { seat: 2, name: "豐田" },
    { seat: 3, name: "豐田" },
    { seat: 4, name: "豐田" },
    { seat: 5, name: "豐田" },
    { seat: 6, name: "豐田" },
    { seat: 7, name: "豐田" },
    { seat: 8, name: "豐田" },
    { seat: 9, name: "豐田" },
    { seat: 10, name: "豐田" },
  ],
  "33": [
    { seat: 1, name: "豊田西" },
    { seat: 2, name: "豊田西" },
    { seat: 3, name: "豊田西" },
    { seat: 4, name: "豊田西" },
    { seat: 5, name: "豊田西" },
    { seat: 6, name: "豊田西" },
    { seat: 7, name: "豊田西" },
    { seat: 8, name: "豊田三好" },
    { seat: 9, name: "豊田三好" },
    { seat: 10, name: "豊田三好" },
  ],
  "34": [
    { seat: 1, name: "豊田西" },
    { seat: 2, name: "豊田西" },
    { seat: 3, name: "豊田西" },
    { seat: 4, name: "豊田西" },
    { seat: 5, name: "豊田西" },
    { seat: 6, name: "豊田西" },
    { seat: 7, name: "豊田西" },
    { seat: 8, name: "豊田西" },
    { seat: 9, name: "豊田西" },
    { seat: 10, name: "豊田西" },
  ],
  "35": [
    { seat: 1, name: "西尾一色" },
    { seat: 2, name: "西尾一色" },
    { seat: 3, name: "西尾一色" },
    { seat: 4, name: "西尾一色" },
    { seat: 5, name: "西尾一色" },
    { seat: 6, name: "高浜" },
    { seat: 7, name: "高浜" },
    { seat: 8, name: "高浜" },
    { seat: 9, name: "高浜" },
    { seat: 10, name: "高浜" },
  ],
  "36": [
    { seat: 1, name: "春日井" },
    { seat: 2, name: "春日井" },
    { seat: 3, name: "春日井" },
    { seat: 4, name: "春日井" },
    { seat: 5, name: "春日井" },
    { seat: 6, name: "名古屋守山" },
    { seat: 7, name: "名古屋守山" },
    { seat: 8, name: "名古屋守山" },
    { seat: 9, name: "名古屋守山" },
    { seat: 10, name: "名古屋守山" },
  ],
  "37": [
    { seat: 1, name: "豐田" },
    { seat: 2, name: "豐田" },
    { seat: 3, name: "豐田" },
    { seat: 4, name: "豐田" },
    { seat: 5, name: "豐田" },
    { seat: 6, name: "豐田" },
    { seat: 7, name: "豐田" },
    { seat: 8, name: "豊田中" },
    { seat: 9, name: "豊田中" },
    { seat: 10, name: "豊田中" },
  ],
  "38": [
    { seat: 1, name: "豐田" },
    { seat: 2, name: "豐田" },
    { seat: 3, name: "豐田" },
    { seat: 4, name: "豐田" },
    { seat: 5, name: "豐田" },
    { seat: 6, name: "愛知三州" },
    { seat: 7, name: "愛知三州" },
    { seat: 8, name: "愛知三州" },
    { seat: 9, name: "愛知三州" },
    { seat: 10, name: "愛知三州" },
  ],
  "39": [
    { seat: 1, name: "西尾" },
    { seat: 2, name: "西尾" },
    { seat: 3, name: "西尾" },
    { seat: 4, name: "西尾" },
    { seat: 5, name: "西尾" },
    { seat: 6, name: "西尾" },
    { seat: 7, name: "西尾KIRARA" },
    { seat: 8, name: "西尾KIRARA" },
    { seat: 9, name: "西尾KIRARA" },
    { seat: 10, name: "西尾KIRARA" },
  ],
  "40": [
    { seat: 1, name: "西尾" },
    { seat: 2, name: "西尾" },
    { seat: 3, name: "西尾" },
    { seat: 4, name: "西尾" },
    { seat: 5, name: "西尾" },
    { seat: 6, name: "西尾" },
    { seat: 7, name: "西尾" },
    { seat: 8, name: "西尾" },
    { seat: 9, name: "西尾" },
    { seat: 10, name: "西尾" },
  ],
  "41": [
    { seat: 1, name: "西尾一色" },
    { seat: 2, name: "西尾一色" },
    { seat: 3, name: "西尾一色" },
    { seat: 4, name: "西尾一色" },
    { seat: 5, name: "高浜" },
    { seat: 6, name: "高浜" },
    { seat: 7, name: "高浜" },
    { seat: 8, name: "高浜" },
    { seat: 9, name: "高浜" },
    { seat: 10, name: "高浜" },
  ],
  "42": [
    { seat: 1, name: "春日井" },
    { seat: 2, name: "春日井" },
    { seat: 3, name: "春日井" },
    { seat: 4, name: "春日井" },
    { seat: 5, name: "春日井" },
    { seat: 6, name: "春日井" },
    { seat: 7, name: "名古屋守山" },
    { seat: 8, name: "名古屋守山" },
    { seat: 9, name: "名古屋守山" },
    { seat: 10, name: "名古屋守山" },
  ],
  "43": [
    { seat: 1, name: "豐田" },
    { seat: 2, name: "豐田" },
    { seat: 3, name: "豐田" },
    { seat: 4, name: "豐田" },
    { seat: 5, name: "豐田" },
    { seat: 6, name: "豐田" },
    { seat: 7, name: "豐田" },
    { seat: 8, name: "豐田" },
    { seat: 9, name: "豐田" },
    { seat: 10, name: "新城" },
  ],
  "44": [
    { seat: 1, name: "刈谷" },
    { seat: 2, name: "刈谷" },
    { seat: 3, name: "刈谷" },
    { seat: 4, name: "刈谷" },
    { seat: 5, name: "刈谷" },
    { seat: 6, name: "西尾" },
    { seat: 7, name: "西尾" },
    { seat: 8, name: "西尾" },
    { seat: 9, name: "西尾" },
    { seat: 10, name: "西尾" },
  ],
  "45": [
    { seat: 1, name: "名古屋千種" },
    { seat: 2, name: "名古屋千種" },
    { seat: 3, name: "名古屋千種" },
    { seat: 4, name: "名古屋千種" },
    { seat: 5, name: "名古屋千種" },
    { seat: 6, name: "名古屋千種" },
    { seat: 7, name: "名古屋千種" },
    { seat: 8, name: "名古屋千種" },
    { seat: 9, name: "名古屋千種" },
    { seat: 10, name: "名古屋千種" },
  ],
  "46": [
    { seat: 1, name: "名古屋千種" },
    { seat: 2, name: "名古屋千種" },
    { seat: 3, name: "名古屋千種" },
    { seat: 4, name: "名古屋千種" },
    { seat: 5, name: "名古屋千種" },
    { seat: 6, name: "名古屋千種" },
    { seat: 7, name: "名古屋千種" },
    { seat: 8, name: "知立" },
    { seat: 9, name: "知立" },
    { seat: 10, name: "知立" },
  ],
  "47": [
    { seat: 1, name: "名古屋名東" },
    { seat: 2, name: "名古屋名東" },
    { seat: 3, name: "名古屋名東" },
    { seat: 4, name: "名古屋名東" },
    { seat: 5, name: "名古屋名東" },
    { seat: 6, name: "名古屋名東" },
    { seat: 7, name: "名古屋名東" },
    { seat: 8, name: "田原パシフィック" },
    { seat: 9, name: "田原パシフィック" },
    { seat: 10, name: "田原パシフィック" },
  ],
  "48": [
    { seat: 1, name: "名古屋守山" },
    { seat: 2, name: "名古屋守山" },
    { seat: 3, name: "名古屋守山" },
    { seat: 4, name: "名古屋守山" },
    { seat: 5, name: "名古屋守山" },
    { seat: 6, name: "名古屋錦" },
    { seat: 7, name: "名古屋錦" },
    { seat: 8, name: "名古屋錦" },
    { seat: 9, name: "名古屋錦" },
    { seat: 10, name: "名古屋錦" },
  ],
  "49": [
    { seat: 1, name: "豊橋" },
    { seat: 2, name: "豊橋" },
    { seat: 3, name: "豊橋" },
    { seat: 4, name: "豊橋" },
    { seat: 5, name: "豊橋" },
    { seat: 6, name: "豊橋" },
    { seat: 7, name: "豊橋" },
    { seat: 8, name: "豊橋" },
    { seat: 9, name: "豊橋" },
    { seat: 10, name: "豊橋" },
  ],
  "50": [
    { seat: 1, name: "豊橋" },
    { seat: 2, name: "豊橋" },
    { seat: 3, name: "豊橋" },
    { seat: 4, name: "豊橋" },
    { seat: 5, name: "豊橋" },
    { seat: 6, name: "豊橋" },
    { seat: 7, name: "豊橋" },
    { seat: 8, name: "豊橋" },
    { seat: 9, name: "豊橋" },
    { seat: 10, name: "豊橋" },
  ],
  "51": [
    { seat: 1, name: "知立" },
    { seat: 2, name: "知立" },
    { seat: 3, name: "知立" },
    { seat: 4, name: "知立" },
    { seat: 5, name: "知立" },
    { seat: 6, name: "知立" },
    { seat: 7, name: "知立" },
    { seat: 8, name: "知立" },
    { seat: 9, name: "知立" },
    { seat: 10, name: "知立" },
  ],
  "52": [
    { seat: 1, name: "知立" },
    { seat: 2, name: "知立" },
    { seat: 3, name: "知立" },
    { seat: 4, name: "知立" },
    { seat: 5, name: "知立" },
    { seat: 6, name: "知立" },
    { seat: 7, name: "知立" },
    { seat: 8, name: "知立" },
    { seat: 9, name: "知立" },
    { seat: 10, name: "知立" },
  ],
  "53": [
    { seat: 1, name: "豊川" },
    { seat: 2, name: "豊川" },
    { seat: 3, name: "豊川" },
    { seat: 4, name: "豊川" },
    { seat: 5, name: "豊川" },
    { seat: 6, name: "豊川" },
    { seat: 7, name: "豊川" },
    { seat: 8, name: "豊川" },
    { seat: 9, name: "豊川" },
    { seat: 10, name: "豊川" },
  ],
  "54": [
    { seat: 1, name: "豊橋" },
    { seat: 2, name: "豊橋" },
    { seat: 3, name: "豊橋" },
    { seat: 4, name: "豊橋" },
    { seat: 5, name: "豊橋" },
    { seat: 6, name: "豊橋" },
    { seat: 7, name: "豊橋南" },
    { seat: 8, name: "豊橋南" },
    { seat: 9, name: "豊橋南" },
    { seat: 10, name: "豊橋南" },
  ],
  "55": [
    { seat: 1, name: "豊橋" },
    { seat: 2, name: "豊橋" },
    { seat: 3, name: "豊橋" },
    { seat: 4, name: "豊橋" },
    { seat: 5, name: "豊橋" },
    { seat: 6, name: "豊橋南" },
    { seat: 7, name: "豊橋南" },
    { seat: 8, name: "豊橋南" },
    { seat: 9, name: "豊橋南" },
    { seat: 10, name: "豊橋南" },
  ],
  "56": [
    { seat: 1, name: "豊川宝飯" },
    { seat: 2, name: "豊川宝飯" },
    { seat: 3, name: "豊川宝飯" },
    { seat: 4, name: "豊川宝飯" },
    { seat: 5, name: "豊川宝飯" },
    { seat: 6, name: "豊川宝飯" },
    { seat: 7, name: "豊川宝飯" },
    { seat: 8, name: "豊橋東" },
    { seat: 9, name: "豊橋東" },
    { seat: 10, name: "豊橋東" },
  ],
  "57": [
    { seat: 1, name: "豊橋北" },
    { seat: 2, name: "田原" },
    { seat: 3, name: "田原" },
    { seat: 4, name: "田原" },
    { seat: 5, name: "田原" },
    { seat: 6, name: "渥美" },
    { seat: 7, name: "渥美" },
    { seat: 8, name: "渥美" },
    { seat: 9, name: "渥美" },
    { seat: 10, name: "渥美" },
  ],
  "S1": [
    { seat: 1, name: "蒲郡" },
    { seat: 2, name: "蒲郡" },
    { seat: 3, name: "蒲郡" },
    { seat: 4, name: "蒲郡" },
    { seat: 5, name: "蒲郡" },
    { seat: 6, name: "蒲郡" },
    { seat: 7, name: "蒲郡" },
    { seat: 8, name: "蒲郡" },
    { seat: 9, name: "蒲郡" },
    { seat: 10, name: "蒲郡" },
  ],
  "S2": [
    { seat: 1, name: "蒲郡" },
    { seat: 2, name: "蒲郡" },
    { seat: 3, name: "蒲郡" },
    { seat: 4, name: "蒲郡" },
    { seat: 5, name: "蒲郡" },
    { seat: 6, name: "蒲郡" },
    { seat: 7, name: "蒲郡" },
    { seat: 8, name: "蒲郡" },
    { seat: 9, name: "蒲郡" },
    { seat: 10, name: "蒲郡" },
  ],
  "S3": [
    { seat: 1, name: "蒲郡" },
    { seat: 2, name: "蒲郡" },
    { seat: 3, name: "蒲郡" },
    { seat: 4, name: "蒲郡" },
    { seat: 5, name: "蒲郡" },
    { seat: 6, name: "蒲郡" },
    { seat: 7, name: "蒲郡" },
    { seat: 8, name: "蒲郡" },
    { seat: 9, name: "蒲郡" },
    { seat: 10, name: "蒲郡" },
  ],
  "S4": [
    { seat: 1, name: "蒲郡" },
    { seat: 2, name: "蒲郡" },
    { seat: 3, name: "蒲郡" },
    { seat: 4, name: "蒲郡" },
    { seat: 5, name: "蒲郡" },
    { seat: 6, name: "蒲郡" },
    { seat: 7, name: "蒲郡" },
    { seat: 8, name: "蒲郡" },
    { seat: 9, name: "蒲郡" },
    { seat: 10, name: "蒲郡" },
  ],
  "S5": [
    { seat: 1, name: "蒲郡" },
    { seat: 2, name: "蒲郡" },
    { seat: 3, name: "蒲郡" },
    { seat: 4, name: "蒲郡" },
    { seat: 5, name: "蒲郡" },
    { seat: 6, name: "蒲郡" },
    { seat: 7, name: "蒲郡" },
    { seat: 8, name: "蒲郡" },
    { seat: 9, name: "蒲郡" },
    { seat: 10, name: "蒲郡" },
  ],
};

/* ── Table layout rows matching PDF ── */

const tableRows = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10, 11],
  [12, 13, 14, 15, 16, 17],
  [18, 19, 20, 21, 22, 23],
  [24, 25, 26, 27, 28, 29],
  [30, 31, 32, 33, 34, 35],
  [36, 37, 38, 39, 40, 41],
  [42, 43, 44, 45, 46, 47],
  [48, 49, 50, 51, 52, 53],
  [54, 55, 56, 57],
];

const skyTables = ["S1", "S2", "S3", "S4", "S5"];

/* ── Screen titles ── */

const titles = {
  home: "地区ナイト",
  agenda: "次第",
  venue: "会場図",
  memberList: "メンバー表",
  food: "料理メニュー",
  drinks: "飲み物",
};

/* ── Utilities ── */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setScreen(screen) {
  backButton.classList.toggle("is-visible", screen !== "home");
  app.dataset.currentScreen = screen;
}

function sortTableIds(ids) {
  return [...ids].sort((a, b) => {
    const na = a.startsWith("S") ? 1000 + parseInt(a.slice(1)) : parseInt(a);
    const nb = b.startsWith("S") ? 1000 + parseInt(b.slice(1)) : parseInt(b);
    return na - nb;
  });
}

function allTableIds() {
  const ids = [];
  const numericIds = new Set();
  for (const id of Object.keys(tableToClubs)) {
    if (!id.startsWith("S")) numericIds.add(parseInt(id, 10));
  }
  for (const id of Object.keys(specialTableData)) {
    if (!id.startsWith("S")) numericIds.add(parseInt(id, 10));
  }
  const maxTable = Math.max(57, ...numericIds);
  for (let i = 1; i <= maxTable; i++) ids.push(String(i));
  skyTables.forEach((s) => ids.push(s));
  return ids;
}

/* ── Venue Selection State ── */

const venueState = { club: null, table: null, seat: null, source: null, displayMode: "list", fromMemberList: false };

function setVenueDropdown(club) {
  const wrapper = document.querySelector("#csel-venueClub");
  if (!wrapper) return;
  if (club) {
    wrapper.querySelector(".csel-label").textContent = club;
    wrapper.dataset.selectedValue = club;
  } else {
    wrapper.querySelector(".csel-label").textContent = "クラブを選んでください";
    wrapper.dataset.selectedValue = "";
  }
}

function renderVenueSelection() {
  const panel = document.querySelector("#venueSelectionPanel");
  if (!panel) return;
  const { club, table, seat, displayMode } = venueState;
  if (!club && !table) { panel.innerHTML = ""; return; }

  /* Display mode toggle */
  let html = `<div class="vsel-mode-toggle">
    <button class="vsel-mode-btn${displayMode === "list" ? " is-active" : ""}" type="button" data-vsel-mode="list">一覧</button>
    <button class="vsel-mode-btn${displayMode === "seatmap" ? " is-active" : ""}" type="button" data-vsel-mode="seatmap">席図</button>
  </div>`;

  if (displayMode === "seatmap") {
    html += renderVenueSelectionSeatmap();
  } else {
    html += renderVenueSelectionList();
  }

  panel.innerHTML = html;
}

function renderVenueSelectionList() {
  const { club, table, seat } = venueState;
  let html = "";

  /* Selected table detail */
  if (table) {
    html += `<div class="vsel-box">`;
    html += `<div class="vsel-head">選択中: <strong>${escapeHtml(table)}番テーブル</strong></div>`;
    if (club && venueState.source !== "map-tap") {
      html += `<div class="vsel-sub">検索元: ${escapeHtml(club)}</div>`;
    }
    const rows = tableToRows(table);
    if (rows.length > 0) {
      html += `<div class="vsel-grid">`;
      for (const r of rows) {
        const isSel = String(r.seat) === String(seat);
        const affiliation = escapeHtml(seatAffiliation(r));
        const person = seatPerson(r);
        const personHtml = person ? `<span class="vsel-person">${escapeHtml(person)}</span>` : "";
        const ciVsel = isCheckedIn(table, r.seat);
        html += `<div class="vsel-cell${isSel ? " is-selected" : ""}${ciVsel ? " is-checked-in" : ""}" data-seat-table="${escapeHtml(table)}" data-seat-num="${r.seat}"><span class="vsel-num">${r.seat}</span><span class="vsel-cell-body"><span class="vsel-affiliation">${affiliation}</span>${personHtml}</span>${ciVsel ? `<span class="check-mark"></span>` : ""}</div>`;
      }
      html += `</div>`;
    }
    html += `</div>`;
  }

  /* Club context */
  if (club && clubSeating[club]) {
    const tables = clubSeating[club];
    const ids = sortTableIds(Object.keys(tables));

    if (!table) {
      html += `<div class="vsel-box"><div class="vsel-head">${escapeHtml(club)}</div>`;
      for (const tblId of ids) {
        html += `<div class="vsel-tbl-label">${escapeHtml(tblId)}番テーブル</div>`;
        html += `<div class="vsel-grid">`;
        for (const s of tables[tblId]) {
          html += `<div class="vsel-cell" data-seat-table="${escapeHtml(tblId)}" data-seat-num="${s}"><span class="vsel-num">${s}</span><span class="vsel-cell-body"><span class="vsel-affiliation">${escapeHtml(club)}</span></span></div>`;
        }
        html += `</div>`;
      }
      html += `</div>`;
    } else {
      const others = ids.filter((t) => t !== table);
      if (others.length > 0) {
        html += `<div class="vsel-extra"><div class="vsel-extra-head">${escapeHtml(club)}の他の席</div>`;
        for (const tblId of others) {
          const seats = tables[tblId];
          html += `<div class="vsel-extra-row"><strong>${escapeHtml(tblId)}番</strong>: ${seats.join(", ")}番席</div>`;
        }
        html += `</div>`;
      }
    }
  }

  return html;
}

function renderVenueSelectionSeatmap() {
  const { club, table, seat } = venueState;
  const targetTable = table || (club && clubSeating[club] ? sortTableIds(Object.keys(clubSeating[club]))[0] : null);
  if (!targetTable) return "";

  const rows = tableToRows(targetTable);
  const count = getTableSeatCount(targetTable);
  if (count === 0) return `<div class="vsel-box"><div class="vsel-head">${escapeHtml(targetTable)}番テーブル</div><p class="mg-empty">登録なし</p></div>`;

  let html = `<div class="vsel-box">`;
  html += `<div class="vsel-head">${escapeHtml(targetTable)}番テーブル — 席図</div>`;
  if (club && venueState.source !== "map-tap") {
    html += `<div class="vsel-sub">検索元: ${escapeHtml(club)}</div>`;
  }

  /* Visual circular seatmap */
  const radius = 80;
  let chips = "";
  for (let i = 0; i < count; i++) {
    const seatNum = i + 1;
    const angle = (i * 360 / count) - 90;
    const rad = angle * Math.PI / 180;
    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;
    const isSel = String(seatNum) === String(seat);
    const row = rows.find((r) => r.seat === seatNum);
    const person = row ? seatPerson(row) : "";
    const chipLabel = person ? `<span class="vsm-chip-label">${escapeHtml(person)}</span>` : "";
    const ciChip = isCheckedIn(targetTable, seatNum);
    chips += `<div class="vsm-chip${isSel ? " is-selected" : ""}${ciChip ? " is-checked-in" : ""}" style="transform:translate(${x.toFixed(1)}px,${y.toFixed(1)}px)" data-seat-table="${escapeHtml(targetTable)}" data-seat-num="${seatNum}"><span class="vsm-chip-num">${seatNum}</span>${chipLabel}</div>`;
  }

  /* Selected seat detail */
  let detailHtml = "";
  if (seat) {
    const selRow = rows.find((r) => String(r.seat) === String(seat));
    if (selRow) {
      const aff = seatAffiliation(selRow);
      const per = seatPerson(selRow);
      detailHtml = `<div class="vsm-detail"><span class="vsm-detail-seat">${seat}番席</span><span class="vsm-detail-club">${escapeHtml(aff)}</span>${per ? `<span class="vsm-detail-person">${escapeHtml(per)}</span>` : ""}</div>`;
    }
  }

  /* Table switching chips for multi-table clubs */
  let tableChipsHtml = "";
  let chipClub = club;
  if (!chipClub) {
    const owners = tableToClubs[targetTable];
    if (owners && owners.length === 1) {
      chipClub = owners[0].club;
    }
  }
  if (chipClub && clubSeating[chipClub]) {
    const ids = sortTableIds(Object.keys(clubSeating[chipClub]));
    if (ids.length > 1) {
      const chipItems = ids.map((id) => {
        const isCurrent = id === targetTable;
        return `<button class="vsm-table-chip${isCurrent ? " is-current" : ""}" type="button" data-vsm-switch-table="${escapeHtml(id)}">${escapeHtml(id)}番</button>`;
      }).join("");
      tableChipsHtml = `<div class="vsm-table-chips">${chipItems}</div>`;
    }
  }

  html += `<div class="vsm-visual">${tableChipsHtml}<div class="vsm-ring">${chips}<div class="vsm-table-center">${escapeHtml(targetTable)}</div></div>${detailHtml}</div>`;
  html += `</div>`;

  return html;
}

/* ── Custom Select (accessible, large for elderly) ── */

function createCustomSelect(id, placeholder, options, onChange) {
  const wrapperId = `csel-${id}`;
  return {
    html: `
      <div class="csel" id="${wrapperId}">
        <button class="csel-btn" type="button" aria-haspopup="listbox" aria-expanded="false" data-csel-toggle="${id}">
          <span class="csel-label">${escapeHtml(placeholder)}</span>
          <span class="csel-arrow">▼</span>
        </button>
        <div class="csel-list" role="listbox" aria-label="${escapeHtml(placeholder)}" tabindex="-1">
          ${options.map((o) => `<div class="csel-option" role="option" data-csel-value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</div>`).join("")}
        </div>
      </div>
    `,
    bind() {
      const wrapper = document.querySelector(`#${wrapperId}`);
      if (!wrapper) return;
      const btn = wrapper.querySelector(".csel-btn");
      const list = wrapper.querySelector(".csel-list");

      btn.addEventListener("click", () => {
        const open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        list.classList.toggle("is-open", !open);
        if (!open) list.scrollTop = 0;
      });

      list.addEventListener("click", (e) => {
        const opt = e.target.closest(".csel-option");
        if (!opt) return;
        const val = opt.dataset.cselValue;
        const label = opt.textContent;
        btn.querySelector(".csel-label").textContent = label;
        btn.setAttribute("aria-expanded", "false");
        list.classList.remove("is-open");
        wrapper.dataset.selectedValue = val;
        if (onChange) onChange(val);
      });

      document.addEventListener("click", (e) => {
        if (!wrapper.contains(e.target)) {
          btn.setAttribute("aria-expanded", "false");
          list.classList.remove("is-open");
        }
      });
    },
  };
}

/* ── Home ── */

function renderHome() {
  setScreen("home");
  app.innerHTML = `
    <h2 class="page-title">地区ナイト</h2>
    <div class="home-grid">
      <button class="home-btn" type="button" data-screen="agenda">
        <span class="home-btn-icon">
          <svg viewBox="0 0 24 24"><path d="M7 4h10M7 9h10M7 14h7M7 19h5"/></svg>
        </span>
        <strong>次第</strong>
      </button>
      <button class="home-btn" type="button" data-screen="memberList">
        <span class="home-btn-icon">
          <svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
        </span>
        <strong>メンバー表</strong>
      </button>
      <button class="home-btn" type="button" data-screen="venue">
        <span class="home-btn-icon">
          <svg viewBox="0 0 24 24"><path d="M5 10a7 7 0 0 1 14 0c0 5-7 11-7 11S5 15 5 10z"/><path d="M9.5 10a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0z"/></svg>
        </span>
        <strong>会場図</strong>
      </button>
      <button class="home-btn" type="button" data-screen="food">
        <span class="home-btn-icon">
          <svg viewBox="0 0 24 24"><path d="M6 3v18M10 3v18M6 8h4M17 3v18"/><path d="M14 3h6v7a3 3 0 0 1-6 0z"/></svg>
        </span>
        <strong>料理メニュー</strong>
      </button>
      <button class="home-btn" type="button" data-screen="drinks">
        <span class="home-btn-icon">
          <svg viewBox="0 0 24 24"><path d="M7 3h10l-1 8a4 4 0 0 1-8 0zM12 15v6M8 21h8"/></svg>
        </span>
        <strong>飲み物</strong>
      </button>
      <button class="home-btn home-btn-checkin" type="button" data-screen="checkin">
        <span class="home-btn-icon">
          <svg viewBox="0 0 24 24"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>
        </span>
        <strong>チェックイン</strong>
      </button>
    </div>
  `;
  window.scrollTo(0, 0);
}

/* ── Agenda ── */

function renderAgenda() {
  setScreen("agenda");
  app.innerHTML = `
    <h2 class="page-title">次第</h2>
    <table class="schedule-table" role="table">
      <thead><tr><th>時刻</th><th>プログラム</th></tr></thead>
      <tbody>
        ${agendaItems.map((item) => `
          <tr class="${item.program.includes("歓談") ? "is-break" : ""}">
            <td class="schedule-time">${escapeHtml(item.time)}</td>
            <td>
              <span class="schedule-program">${escapeHtml(item.program)}</span>
              ${item.presenter ? `<span class="schedule-presenter">${escapeHtml(item.presenter)}</span>` : ""}
            </td>
          </tr>`).join("")}
      </tbody>
    </table>

  `;
  window.scrollTo(0, 0);
}

/* ── Venue Map ── */

function buildTableMap(highlightSet) {
  function cell(num) {
    const id = String(num);
    const highlighted = highlightSet && highlightSet.has(id);
    const hasCI = tableHasCheckins(id);
    const allCI = tableAllCheckedIn(id);
    return `<div class="map-cell ${highlighted ? "is-highlighted" : ""}${allCI ? " all-checked-in" : hasCI ? " has-checkin" : ""}" data-map-table="${escapeHtml(id)}"><span class="map-cell-num">${escapeHtml(id)}</span></div>`;
  }

  const mainRows = tableRows.map((row) => {
    const cells = row.map(cell).join("");
    return `<div class="map-row map-row-${row.length}">${cells}</div>`;
  });

  function skyCell(id) {
    const highlighted = highlightSet && highlightSet.has(id);
    const hasCI = tableHasCheckins(id);
    const allCI = tableAllCheckedIn(id);
    return `<div class="map-cell map-cell-sky ${highlighted ? "is-highlighted" : ""}${allCI ? " all-checked-in" : hasCI ? " has-checkin" : ""}" data-map-table="${escapeHtml(id)}"><span class="map-cell-num">${escapeHtml(id)}</span></div>`;
  }

  /* Sky Lounge: 3-column grid aligned so S2 is above S1, S4 is above S3, S5 bottom-right */
  const skyCells = [
    skyCell("S2"), skyCell("S4"), `<div class="sky-spacer" aria-hidden="true"></div>`,
    skyCell("S1"), skyCell("S3"), skyCell("S5"),
  ].join("");

  return `
    <div class="venue-map-container">
      <p class="map-scroll-hint">指でスクロールできます ↔ ↕</p>
      <div class="map-scroll-area">
        <div class="map-inner">
          <div class="map-label">ステージ側</div>
          <div class="map-main">${mainRows.join("")}</div>
          <div class="map-markers">
            <span class="map-marker map-marker-toilet">↓ トイレ</span>
            <span class="map-marker map-marker-entrance-top">出入り口 →</span>
            <span class="map-marker map-marker-entrance-bottom">出入り口 →</span>
          </div>
          <div class="map-label map-label-sky">Sky Lounge</div>
          <div class="sky-layout">
            <div class="sky-stage-label">ステージ</div>
            <div class="sky-grid">${skyCells}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderVenue(options) {
  setScreen("venue");
  const selectedClub = options?.selectedClub || null;
  const selectedTable = options?.selectedTable || null;
  const source = options?.source || null;
  const fromMemberList = options?.fromMemberList || false;

  /* Initialize venueState */
  venueState.club = selectedClub;
  venueState.table = selectedTable;
  venueState.seat = null;
  venueState.source = source;
  venueState.fromMemberList = fromMemberList;
  /* displayMode is NOT reset here — preserve user's toggle choice across re-renders */

  /* Build highlight set */
  let hSet = options?.highlightTables ? new Set(options.highlightTables) : null;
  if (selectedClub && clubSeating[selectedClub]) {
    const clubTblIds = Object.keys(clubSeating[selectedClub]);
    if (!hSet) hSet = new Set(clubTblIds);
    else for (const id of clubTblIds) hSet.add(id);
  }

  const clubOpts = sortClubNames(Object.keys(clubSeating)).map((n) => ({ value: n, label: n }));
  const allTbls = allTableIds();
  const tableOpts = allTbls.map((id) => ({ value: id, label: `${id}番テーブル` }));
  const cselClub = createCustomSelect("venueClub", "クラブを選んでください", clubOpts, onVenueClubChange);
  const cselTable = createCustomSelect("venueTable", "テーブルを選んでください", tableOpts, onVenueTableSearch);

  const memberListBackHtml = fromMemberList
    ? `<button class="venue-back-member" type="button" data-back-to-member>&#8249; メンバー表</button>`
    : "";

  app.innerHTML = `
    ${memberListBackHtml}
    <h2 class="page-title">会場図</h2>
    <div class="search-mode-group" role="radiogroup" aria-label="検索モード">
      <label class="search-mode-option"><input class="search-mode-radio" type="radio" name="venueSearchMode" value="club" checked><span class="search-mode-label">クラブ</span></label>
      <label class="search-mode-option"><input class="search-mode-radio" type="radio" name="venueSearchMode" value="table"><span class="search-mode-label">テーブル</span></label>
      <label class="search-mode-option"><input class="search-mode-radio" type="radio" name="venueSearchMode" value="free"><span class="search-mode-label">名前で検索</span></label>
    </div>
    <div id="venueSearchByClub">${cselClub.html}</div>
    <div id="venueSearchByTable" style="display:none">${cselTable.html}</div>
    <div id="venueSearchByFree" style="display:none">
      <input class="field-input" id="venueFreetextInput" type="search" inputmode="search" autocomplete="off" placeholder="名前・クラブ名・テーブル番号で検索" aria-label="名前で検索" />
    </div>
    <div id="venueSearchResult" class="seat-result"></div>
    <div id="venueSelectionPanel" class="vsel-panel"></div>
    ${buildTableMap(hSet)}

  `;
  cselClub.bind();
  cselTable.bind();

  /* Search mode toggle */
  document.querySelectorAll('input[name="venueSearchMode"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      document.querySelector("#venueSearchByClub").style.display = e.target.value === "club" ? "" : "none";
      document.querySelector("#venueSearchByTable").style.display = e.target.value === "table" ? "" : "none";
      document.querySelector("#venueSearchByFree").style.display = e.target.value === "free" ? "" : "none";
      document.querySelector("#venueSearchResult").innerHTML = "";
      resetVenueMapHighlights();
    });
  });

  /* Free-text search */
  document.querySelector("#venueFreetextInput").addEventListener("input", (e) => {
    onVenueFreetextSearch(e.target.value);
  });

  /* Set initial dropdown + panel from handoff state */
  if (selectedClub && clubSeating[selectedClub]) {
    setVenueDropdown(selectedClub);
  }
  renderVenueSelection();

  window.scrollTo(0, 0);

  /* Center map horizontally on initial render */
  requestAnimationFrame(() => {
    const mapArea = document.querySelector(".map-scroll-area");
    if (mapArea) mapArea.scrollLeft = (mapArea.scrollWidth - mapArea.clientWidth) / 2;
  });
}

function onVenueClubChange(club) {
  if (!club || !clubSeating[club]) {
    venueState.club = null;
    venueState.table = null;
    venueState.seat = null;
    venueState.source = "venue-dropdown";
    renderVenueSelection();
    const mc = document.querySelector(".venue-map-container");
    if (mc) mc.outerHTML = buildTableMap(null);
    return;
  }
  venueState.club = club;
  venueState.table = null;
  venueState.seat = null;
  venueState.source = "venue-dropdown";
  renderVenueSelection();

  const tableIds = sortTableIds(Object.keys(clubSeating[club]));
  const mc = document.querySelector(".venue-map-container");
  if (mc) mc.outerHTML = buildTableMap(new Set(tableIds));
}

function onVenueTableSearch(tbl) {
  if (!tbl) return;
  venueState.club = null;
  venueState.table = tbl;
  venueState.seat = null;
  venueState.source = "venue-table-select";
  renderVenueSelection();
  const mc = document.querySelector(".venue-map-container");
  if (mc) mc.outerHTML = buildTableMap(new Set([tbl]));
}

function resetVenueMapHighlights() {
  const mc = document.querySelector(".venue-map-container");
  if (mc) mc.outerHTML = buildTableMap(null);
}

function onVenueFreetextSearch(query) {
  const result = document.querySelector("#venueSearchResult");
  const q = (query || "").trim().toLowerCase();
  if (!q) {
    if (result) result.innerHTML = "";
    resetVenueMapHighlights();
    return;
  }

  const matchedTables = new Set();
  for (const tbl of allTableIds()) {
    const rows = tableToRows(tbl);
    const hasMatch = rows.some((row) => seatSearchText(row, tbl).toLowerCase().includes(q));
    if (hasMatch) matchedTables.add(tbl);
  }

  if (matchedTables.size === 0) {
    if (result) result.innerHTML = `<p class="mg-empty">該当なし</p>`;
    resetVenueMapHighlights();
    return;
  }

  if (result) {
    const cards = [];
    for (const tbl of allTableIds()) {
      if (!matchedTables.has(tbl)) continue;
      const rows = tableToRows(tbl);
      cards.push(buildSearchResultCard(tbl, rows, { source: "venue-freetext" }));
    }
    result.innerHTML = cards.join("");
  }

  const mc = document.querySelector(".venue-map-container");
  if (mc) mc.outerHTML = buildTableMap(matchedTables);
}

/* ── Member List (メンバー表) ── */

function renderMemberList() {
  setScreen("memberList");
  const allTbls = allTableIds();
  const allClubNames = sortClubNames(Object.keys(clubSeating));
  const clubOpts = allClubNames.map((n) => ({ value: n, label: n }));
  const tableOpts = allTbls.map((id) => ({ value: id, label: `${id}番テーブル` }));
  const cselClub = createCustomSelect("mlClub", "クラブを選んでください", clubOpts, onMemberClubSearch);
  const cselTable = createCustomSelect("mlTable", "テーブルを選んでください", tableOpts, onMemberTableSearch);

  function buildCardRows(tbl) {
    const special = specialTableData[tbl];
    if (special) {
      return special.map((r) => memberRowHtml(r, tbl)).join("");
    }
    const clubs = tableToClubs[tbl];
    if (!clubs || clubs.length === 0) return `<div class="mg-empty">登録なし</div>`;
    const rows = [];
    for (const c of clubs) {
      for (const seat of c.seats) {
        rows.push({ seat, club: c.club });
      }
    }
    rows.sort((a, b) => a.seat - b.seat);
    return rows.map((r) => memberRowHtml(r, tbl)).join("");
  }

  function buildMemberGrid() {
    const cards = [];
    const hasTablesAfter57 = allTbls.some((id) => !id.startsWith("S") && parseInt(id, 10) >= 58);
    for (const tbl of allTbls) {
      cards.push(`<div class="mg-card mg-card-clickable" role="button" tabindex="0" data-goto-venue="${escapeHtml(tbl)}" data-goto-source="memberList" data-from-member="1"><div class="mg-header"><span class="mg-header-num">${escapeHtml(tbl)}</span><span class="mg-header-label">テーブル</span></div>${buildCardRows(tbl)}<span class="mg-venue-badge">会場図で見る</span></div>`);
      if (tbl === "57") {
        cards.push(`<div class="member-grid-spacer" aria-hidden="true"></div>`);
      }
      if (tbl === "57" && !hasTablesAfter57) {
        cards.push(`<div class="member-grid-separator" role="separator">Sky Lounge</div>`);
      }
      if (!tbl.startsWith("S")) {
        const nextIndex = allTbls.indexOf(tbl) + 1;
        const nextTbl = allTbls[nextIndex];
        if (nextTbl && nextTbl.startsWith("S") && (tbl !== "57" || hasTablesAfter57)) {
          cards.push(`<div class="member-grid-separator" role="separator">Sky Lounge</div>`);
        }
      }
    }
    return cards.join("");
  }

  app.innerHTML = `
    <div class="member-title-bar">
      <h2 class="page-title">メンバー表</h2>
      <button class="member-search-toggle" type="button" id="memberSearchToggle" aria-expanded="false">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7.5"/><path d="M16 16l5 5"/></svg>
        <span>検索</span>
      </button>
    </div>

    <div id="memberSearchPanel" class="member-search-section" style="display:none">
      <div class="search-mode-group" role="radiogroup" aria-label="検索モード">
        <label class="search-mode-option"><input class="search-mode-radio" type="radio" name="searchMode" value="club" checked><span class="search-mode-label">クラブ</span></label>
        <label class="search-mode-option"><input class="search-mode-radio" type="radio" name="searchMode" value="table"><span class="search-mode-label">テーブル</span></label>
        <label class="search-mode-option"><input class="search-mode-radio" type="radio" name="searchMode" value="name"><span class="search-mode-label">名前で検索</span></label>
      </div>
      <div id="searchByClub" class="member-search-panel">${cselClub.html}</div>
      <div id="searchByTable" class="member-search-panel" style="display:none">${cselTable.html}</div>
      <div id="searchByName" class="member-search-panel" style="display:none">
        <input class="field-input" id="memberNameInput" type="search" inputmode="search" autocomplete="off" placeholder="名前・クラブ名・テーブル番号で検索" aria-label="名前で検索" />
      </div>
      <div id="memberSearchResult" class="seat-result"></div>
    </div>

    <div class="member-grid">
      ${buildMemberGrid()}
    </div>

  `;

  cselClub.bind();
  cselTable.bind();

  document.querySelector("#memberSearchToggle").addEventListener("click", () => {
    const panel = document.querySelector("#memberSearchPanel");
    const btn = document.querySelector("#memberSearchToggle");
    const open = panel.style.display !== "none";
    panel.style.display = open ? "none" : "";
    btn.setAttribute("aria-expanded", String(!open));
  });

  document.querySelectorAll('input[name="searchMode"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      document.querySelector("#searchByClub").style.display = e.target.value === "club" ? "" : "none";
      document.querySelector("#searchByTable").style.display = e.target.value === "table" ? "" : "none";
      document.querySelector("#searchByName").style.display = e.target.value === "name" ? "" : "none";
      document.querySelector("#memberSearchResult").innerHTML = "";
    });
  });

  document.querySelector("#memberNameInput").addEventListener("input", (e) => {
    onMemberNameSearch(e.target.value);
  });

  window.scrollTo(0, 0);
}

function buildSearchResultCard(tbl, rows, sourceInfo) {
  const rowsHtml = rows.map((r) => memberRowHtml(r, tbl)).join("");
  const srcAttrs = sourceInfo
    ? ` data-goto-source="${escapeHtml(sourceInfo.source)}"${sourceInfo.club ? ` data-goto-club="${escapeHtml(sourceInfo.club)}"` : ""} data-from-member="1"`
    : "";
  return `
    <div class="mg-card mg-card-result">
      <div class="mg-header"><span class="mg-header-num">${escapeHtml(tbl)}</span><span class="mg-header-label">テーブル</span></div>
      ${rowsHtml}
      <button class="venue-link-btn venue-link-btn-block" type="button" data-goto-venue="${escapeHtml(tbl)}"${srcAttrs}>会場図で見る</button>
    </div>`;
}

function tableToRows(tbl) {
  const special = specialTableData[tbl];
  if (special) return special.map((s) => ({
    seat: s.seat,
    club: seatAffiliation(s),
    person: seatPerson(s),
  }));
  const clubs = tableToClubs[tbl];
  if (!clubs || clubs.length === 0) return [];
  const rows = [];
  for (const c of clubs) {
    for (const seat of c.seats) {
      rows.push({ seat, club: c.club });
    }
  }
  rows.sort((a, b) => a.seat - b.seat);
  return rows;
}

function onMemberClubSearch(club) {
  const result = document.querySelector("#memberSearchResult");
  if (!club) { result.innerHTML = ""; return; }

  const cards = [];

  /* Check specialTableData for this club name */
  for (const [tblId, entries] of Object.entries(specialTableData)) {
    const matched = entries.filter((e) => seatAffiliation(e) === club);
    if (matched.length > 0) {
      cards.push({ tbl: tblId, html: buildSearchResultCard(tblId, matched, { source: "club", club }) });
    }
  }

  /* Check clubSeating */
  if (clubSeating[club]) {
    const tables = clubSeating[club];
    const tableIds = sortTableIds(Object.keys(tables));
    for (const tbl of tableIds) {
      if (!cards.some((c) => c.tbl === tbl)) {
        const rows = tables[tbl].map((s) => ({ seat: s, club }));
        cards.push({ tbl, html: buildSearchResultCard(tbl, rows, { source: "club", club }) });
      }
    }
  }

  if (cards.length === 0) { result.innerHTML = ""; return; }
  result.innerHTML = `<div class="seat-result-header">${escapeHtml(club)}</div>${cards.map((c) => c.html).join("")}`;
}

function onMemberTableSearch(tbl) {
  const result = document.querySelector("#memberSearchResult");
  if (!tbl) { result.innerHTML = ""; return; }
  const rows = tableToRows(tbl);
  if (rows.length === 0) {
    result.innerHTML = `<div class="seat-result-header">${escapeHtml(tbl)}番テーブル</div><p class="mg-empty">登録なし</p>`;
    return;
  }
  result.innerHTML = buildSearchResultCard(tbl, rows, { source: "table" });
}

function onMemberNameSearch(query) {
  const result = document.querySelector("#memberSearchResult");
  const q = query.trim();
  if (!q) { result.innerHTML = ""; return; }

  const cards = [];
  for (const tbl of allTableIds()) {
    const matchedRows = tableToRows(tbl).filter((row) => seatSearchText(row, tbl).includes(q));
    if (matchedRows.length > 0) {
      cards.push(buildSearchResultCard(tbl, matchedRows, { source: "table" }));
    }
  }

  if (cards.length === 0) {
    result.innerHTML = `<div class="seat-result-header">${escapeHtml(q)}</div><p class="mg-empty">該当なし</p>`;
    return;
  }
  result.innerHTML = `<div class="seat-result-header">${escapeHtml(q)}</div>${cards.join("")}`;
}

/* ── Food Menu ── */

function renderFood() {
  setScreen("food");
  let courseNum = 0;
  const rows = foodMenu.map((item) => {
    if (item.course) {
      courseNum++;
      return `
        <div class="food-course">
          <div class="food-course-header"><span class="food-num">${courseNum}</span><strong>${escapeHtml(item.course)}</strong></div>
          <ul class="food-sub-list">
            ${item.items.map((sub) => `<li><span class="food-zh">${escapeHtml(sub.zh)}</span><span class="food-ja">${escapeHtml(sub.ja)}</span></li>`).join("")}
          </ul>
        </div>`;
    }
    courseNum++;
    return `
      <div class="food-item">
        <span class="food-num">${courseNum}</span>
        <div><span class="food-zh">${escapeHtml(item.zh)}</span><span class="food-ja">${escapeHtml(item.ja)}</span></div>
      </div>`;
  });

  app.innerHTML = `
    <h2 class="page-title">料理メニュー</h2>
    <p class="page-sub">食事メニュー</p>
    <div class="food-list">${rows.join("")}</div>

  `;
  window.scrollTo(0, 0);
}

/* ── Drinks (order card UI) ── */

function renderDrinks() {
  setScreen("drinks");
  const sections = drinkCategories.map((cat) => {
    const items = drinkItems.filter((d) => d.cat === cat.key);
    return `
      <div class="drink-category">
        <div class="drink-cat-label drink-cat-${cat.key}">${escapeHtml(cat.label)}</div>
        <div class="drink-grid">
          ${items.map((item) => `
            <button class="drink-btn drink-btn-${item.cat}" type="button" data-drink-num="${item.num}">
              <span class="drink-btn-num drink-num-${item.cat}">${item.num}</span>
              <span class="drink-btn-name">${escapeHtml(item.ja)}</span>
            </button>`).join("")}
        </div>
      </div>`;
  }).join("");

  app.innerHTML = `
    <h2 class="page-title">飲み物</h2>
    <p class="page-sub">ボタンをタップして注文カードを表示</p>
    ${sections}

  `;
  window.scrollTo(0, 0);
}

function openDrinkModal(num) {
  const item = drinkItems.find((d) => d.num === num);
  if (!item) return;

  const overlay = document.createElement("div");
  overlay.className = "drink-modal-overlay";
  let qty = 1;

  function render() {
    overlay.innerHTML = `
      <div class="drink-modal">
        <div class="drink-modal-zh">${escapeHtml(item.zh)}</div>
        <div class="drink-modal-ja">${escapeHtml(item.ja)}</div>
        <div class="drink-modal-qty">
          <button class="drink-qty-btn" type="button" data-qty-action="minus">−</button>
          <span class="drink-qty-num">${qty}</span>
          <button class="drink-qty-btn" type="button" data-qty-action="plus">＋</button>
        </div>
        <div class="drink-modal-staff">スタッフに見せてください</div>
        <div class="drink-modal-order">我要點：${escapeHtml(item.zh)} × ${qty}</div>
        <button class="drink-modal-close" type="button">閉じる</button>
      </div>
    `;
  }

  render();
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    const action = e.target.dataset.qtyAction;
    if (action === "plus") { qty++; render(); return; }
    if (action === "minus") { if (qty > 1) qty--; render(); return; }
    if (e.target.closest(".drink-modal-close")) { overlay.remove(); return; }
  });
}

/* ── Seat Circle (radial seat numbers around table) ── */

function getTableSeatCount(tblId) {
  const special = specialTableData[tblId];
  if (special) return special.length;
  return 10;
}

function showSeatCircle(mapCell, tblId, highlightSeat) {
  document.querySelectorAll(".seat-circle").forEach((el) => el.remove());

  const count = getTableSeatCount(tblId);
  const radius = 44;

  const container = document.createElement("div");
  container.className = "seat-circle";

  for (let i = 0; i < count; i++) {
    const seatNum = i + 1;
    const angle = (i * 360 / count) - 90;
    const rad = angle * Math.PI / 180;
    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;

    const el = document.createElement("span");
    el.className = "seat-circle-num";
    if (isCheckedIn(tblId, seatNum)) {
      el.classList.add("is-checked-in");
    }
    if (String(seatNum) === String(highlightSeat)) {
      el.classList.add("is-selected");
    }
    el.textContent = seatNum;
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    container.appendChild(el);
  }

  mapCell.appendChild(container);
}

function centerMapCell(mapCell) {
  requestAnimationFrame(() => {
    const scrollArea = document.querySelector(".map-scroll-area");
    if (!scrollArea) { return; }
    const areaRect = scrollArea.getBoundingClientRect();
    const cellRect = mapCell.getBoundingClientRect();
    const targetLeft = scrollArea.scrollLeft + (cellRect.left + cellRect.width / 2) - (areaRect.left + areaRect.width / 2);
    const targetTop = scrollArea.scrollTop + (cellRect.top + cellRect.height / 2) - (areaRect.top + areaRect.height / 2);
    scrollArea.scrollTo({ left: targetLeft, top: targetTop, behavior: "smooth" });
  });
}

/* ── Shared ── */


function renderScreen(screen, options) {
  const renderers = {
    home: renderHome,
    agenda: renderAgenda,
    venue: () => renderVenue(options),
    memberList: renderMemberList,
    food: renderFood,
    drinks: renderDrinks,
    checkin: renderCheckin,
    checkinConfirm: renderCheckinConfirm,
  };
  (renderers[screen] || renderHome)();
  refreshPersonNamesForScreen(screen);
}

/* ── Event Delegation ── */

app.addEventListener("click", (event) => {
  const screenBtn = event.target.closest("[data-screen]");
  if (screenBtn) { renderScreen(screenBtn.dataset.screen); return; }


  const drinkBtn = event.target.closest("[data-drink-num]");
  if (drinkBtn) { openDrinkModal(parseInt(drinkBtn.dataset.drinkNum)); return; }

  const backToMember = event.target.closest("[data-back-to-member]");
  if (backToMember) { renderMemberList(); return; }

  const vselMode = event.target.closest("[data-vsel-mode]");
  if (vselMode) {
    venueState.displayMode = vselMode.dataset.vselMode;
    renderVenueSelection();
    return;
  }

  const vsmSwitch = event.target.closest("[data-vsm-switch-table]");
  if (vsmSwitch) {
    const newTable = vsmSwitch.dataset.vsmSwitchTable;
    venueState.table = newTable;
    venueState.seat = null;
    renderVenueSelection();
    const mapEl = document.querySelector(`[data-map-table="${newTable}"]`);
    if (mapEl) {
      document.querySelectorAll(".map-cell.is-tapped").forEach((el) => el.classList.remove("is-tapped"));
      mapEl.classList.add("is-tapped");
      centerMapCell(mapEl);
    }
    return;
  }

  const gotoVenue = event.target.closest("[data-goto-venue]");
  if (gotoVenue) {
    const tbl = gotoVenue.dataset.gotoVenue;
    const source = gotoVenue.dataset.gotoSource || null;
    let club = gotoVenue.dataset.gotoClub || null;
    if (!club) {
      const owners = tableToClubs[tbl];
      if (owners && owners.length === 1) club = owners[0].club;
    }
    const fromMember = gotoVenue.dataset.fromMember === "1";
    renderScreen("venue", {
      highlightTables: [tbl],
      selectedClub: club,
      selectedTable: tbl,
      source: source,
      fromMemberList: fromMember,
    });
    setTimeout(() => {
      const el = document.querySelector(`[data-map-table="${tbl}"]`);
      if (el) {
        el.classList.add("is-tapped");
        showSeatCircle(el, tbl);
        centerMapCell(el);
      }
    }, 100);
    return;
  }

  /* Seat cell / chip tap */
  const seatChip = event.target.closest("[data-seat-table]");
  if (seatChip) {
    const tbl = seatChip.dataset.seatTable;
    const seatNum = seatChip.dataset.seatNum;
    venueState.table = tbl;
    venueState.seat = seatNum;
    venueState.source = "seat-chip";
    const savedScrollY = window.scrollY;
    renderVenueSelection();
    window.scrollTo(0, savedScrollY);
    const mapEl = document.querySelector(`[data-map-table="${tbl}"]`);
    if (mapEl) {
      document.querySelectorAll(".map-cell.is-tapped").forEach((el) => el.classList.remove("is-tapped"));
      mapEl.classList.add("is-tapped");
      showSeatCircle(mapEl, tbl, seatNum);
      centerMapCell(mapEl);
    }
    return;
  }

  /* Map cell tap */
  const mapCell = event.target.closest("[data-map-table]");
  if (mapCell) {
    document.querySelectorAll(".map-cell.is-tapped").forEach((el) => el.classList.remove("is-tapped"));
    mapCell.classList.add("is-tapped");
    const tblId = mapCell.dataset.mapTable;
    showSeatCircle(mapCell, tblId);
    centerMapCell(mapCell);

    /* Clear stale search-origin highlights, then re-apply club context highlights */
    document.querySelectorAll(".map-cell.is-highlighted").forEach((el) => el.classList.remove("is-highlighted"));

    /* Bidirectional: update venueState + dropdown */
    venueState.table = tblId;
    venueState.seat = null;
    venueState.source = "map-tap";

    /* Check if tapped table belongs to the currently selected club */
    const currentClub = venueState.club;
    const belongsToCurrent = currentClub && clubSeating[currentClub]
      && Object.keys(clubSeating[currentClub]).includes(tblId);

    if (belongsToCurrent) {
      /* Keep club context — re-highlight all club tables */
      const clubTblIds = Object.keys(clubSeating[currentClub]);
      for (const id of clubTblIds) {
        const el = document.querySelector(`[data-map-table="${id}"]`);
        if (el) el.classList.add("is-highlighted");
      }
    } else {
      /* Determine new club from tapped table */
      const clubs = tableToClubs[tblId];
      if (clubs && clubs.length === 1) {
        venueState.club = clubs[0].club;
        setVenueDropdown(clubs[0].club);
        /* Highlight new single-club tables */
        const newTblIds = Object.keys(clubSeating[clubs[0].club]);
        for (const id of newTblIds) {
          const el = document.querySelector(`[data-map-table="${id}"]`);
          if (el) el.classList.add("is-highlighted");
        }
      } else {
        venueState.club = null;
        setVenueDropdown(null);
      }
    }
    renderVenueSelection();
  }
});

backButton.addEventListener("click", renderHome);

/* Keyboard support for role="button" cards */
app.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest(".mg-card-clickable[data-goto-venue]");
  if (!card) return;
  event.preventDefault();
  card.click();
});

/* ── Person Names: static payload support ── */

/**
 * Tables excluded from person-name merging (pre-named personal tables and Sky Lounge).
 */
const PERSON_MERGE_SKIP = { "2": true, "3": true, "4": true };
let personNamesRequestSeq = 0;

function clearApiPersonNames() {
  for (const rows of Object.values(specialTableData)) {
    for (const row of rows) {
      if (row._apiPersonName) {
        delete row.personName;
        delete row._apiPersonName;
      }
    }
  }
}

function mergePersonNames(json) {
  if (!json || !json.tables) return 0;
  let merged = 0;
  for (const [tableId, entries] of Object.entries(json.tables)) {
    if (PERSON_MERGE_SKIP[tableId]) continue;
    const tableData = specialTableData[tableId];
    if (!tableData) continue;
    for (const entry of entries) {
      if (!entry.person) continue;
      const row = tableData.find((r) => r.seat === entry.seat);
      if (row) {
        row.personName = entry.person;
        row._apiPersonName = true;
        merged++;
      }
    }
  }
  return merged;
}

function applyPersonNamePayload(json) {
  clearApiPersonNames();
  const count = mergePersonNames(json);
  if (app.dataset.currentScreen === "memberList") {
    renderMemberList();
  } else if (app.dataset.currentScreen === "venue") {
    renderVenue({
      selectedClub: venueState.club,
      selectedTable: venueState.table,
      source: venueState.source,
      fromMemberList: venueState.fromMemberList,
    });
  }
  return count;
}

async function loadPersonNamesFromApi() {
  const seq = ++personNamesRequestSeq;
  const payload = await requestJson(PERSON_NAMES_API_URL, {
    method: "GET",
    cache: "no-store",
  });
  if (seq !== personNamesRequestSeq) return 0;
  return applyPersonNamePayload(payload);
}

function refreshPersonNamesForScreen(screen) {
  if (screen === "memberList" || screen === "venue") {
    loadPersonNamesFromApi().catch((err) => console.warn(err));
  }
}

/* ── Dev Preview: data reload hook ── */

window.__devReloadPersonNames = function () {
  loadPersonNamesFromApi()
    .then(() => {
      const screen = app.dataset.currentScreen;
      if (screen === "memberList") renderMemberList();
      else if (screen === "venue") renderVenue({
        selectedClub: venueState.club,
        selectedTable: venueState.table,
        source: venueState.source,
        fromMemberList: venueState.fromMemberList,
      });
      else if (screen === "checkin") renderCheckin();
    })
    .catch((err) => console.warn("dev reload error:", err));
};

/* ── Check-in (localStorage only) ── */

const CHECKIN_STORAGE_KEY = "rotary_checkin_v1";

function loadCheckins() {
  try {
    return JSON.parse(localStorage.getItem(CHECKIN_STORAGE_KEY) || "{}");
  } catch { return {}; }
}

function saveCheckins(data) {
  localStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(data));
}

function checkinKey(tableId, seat) {
  return `${tableId}-${seat}`;
}

function isCheckedIn(tableId, seat) {
  return !!loadCheckins()[checkinKey(tableId, seat)];
}

function tableHasCheckins(tableId) {
  const data = loadCheckins();
  return Object.keys(data).some((k) => k.startsWith(tableId + "-"));
}

function tableAllCheckedIn(tableId) {
  const data = loadCheckins();
  const count = getTableSeatCount(tableId);
  for (let i = 1; i <= count; i++) {
    if (!data[checkinKey(tableId, i)]) return false;
  }
  return count > 0;
}

let checkinSelections = {};
let checkinAbort = null;

function checkinToggleSelect(tableId, seat, club, name, personName) {
  const k = checkinKey(tableId, seat);
  if (checkinSelections[k]) {
    const next = Object.assign({}, checkinSelections);
    delete next[k];
    checkinSelections = next;
  } else {
    checkinSelections = Object.assign({}, checkinSelections, {
      [k]: { tableId, seat, club, name, personName: personName || "" }
    });
  }
}

function buildCheckinPersonList() {
  const allTbls = allTableIds();
  const rows = [];
  for (const tbl of allTbls) {
    const special = specialTableData[tbl];
    if (special) {
      const isPersonalTable = !!PERSON_MERGE_SKIP[tbl];
      for (const row of special) {
        const person = seatPerson(row);
        const affiliation = seatAffiliation(row);
        const club = isPersonalTable ? "" : affiliation;
        const personName = isPersonalTable ? (affiliation || person) : person;
        rows.push({
          tableId: tbl,
          seat: row.seat,
          club: club,
          personName: personName,
          name: personName || affiliation,
        });
      }
    } else {
      const clubs = tableToClubs[tbl];
      if (!clubs) continue;
      for (const c of clubs) {
        for (const seat of c.seats) {
          rows.push({ tableId: tbl, seat, club: c.club, personName: "", name: c.club });
        }
      }
    }
  }
  return rows;
}

function renderCheckin() {
  setScreen("checkin");
  if (checkinAbort) checkinAbort.abort();
  checkinAbort = new AbortController();
  const signal = checkinAbort.signal;
  checkinSelections = {};
  const checkins = loadCheckins();
  const checkedInCount = Object.keys(checkins).length;

  const allTbls = allTableIds();
  const clubOpts = sortClubNames(Object.keys(clubSeating)).map((n) => ({ value: n, label: n }));
  const tableOpts = allTbls.map((id) => ({ value: id, label: `${id}番テーブル` }));
  const cselClub = createCustomSelect("ciClub", "クラブを選んでください", clubOpts, onCiClubFilter);
  const cselTable = createCustomSelect("ciTable", "テーブルを選んでください", tableOpts, onCiTableFilter);

  app.innerHTML = `
    <h2 class="page-title">チェックイン</h2>
    <p class="ci-sub">人物を選択してチェックイン登録できます</p>
    ${checkedInCount > 0 ? `<div class="ci-status">チェックイン済み: <strong>${checkedInCount}名</strong></div>` : ""}
    <div class="search-mode-group" role="radiogroup" aria-label="検索モード">
      <label class="search-mode-option"><input class="search-mode-radio" type="radio" name="ciSearchMode" value="club" checked><span class="search-mode-label">クラブ</span></label>
      <label class="search-mode-option"><input class="search-mode-radio" type="radio" name="ciSearchMode" value="table"><span class="search-mode-label">テーブル</span></label>
      <label class="search-mode-option"><input class="search-mode-radio" type="radio" name="ciSearchMode" value="free"><span class="search-mode-label">名前で検索</span></label>
    </div>
    <div id="ciSearchByClub">${cselClub.html}</div>
    <div id="ciSearchByTable" style="display:none">${cselTable.html}</div>
    <div id="ciSearchByFree" style="display:none">
      <input class="field-input" id="ciSearchInput" type="search" placeholder="名前・クラブ名・テーブル番号で検索" autocomplete="off" inputmode="search" />
    </div>
    <div class="ci-person-list" id="ciPersonList"></div>
    <div class="action-bar action-bar--inline action-bar--phone" id="ciActions" style="display:none">
      <button class="btn btn-primary" id="ciConfirmBtn">確認画面へ</button>
    </div>

  `;
  cselClub.bind();
  cselTable.bind();

  const personList = buildCheckinPersonList();
  let ciFilterMode = "club";
  let ciFilterValue = "";

  function onCiClubFilter(club) {
    ciFilterValue = club || "";
    renderPersonList(ciFilterMode === "club" ? ciFilterValue : "");
  }

  function onCiTableFilter(tbl) {
    ciFilterValue = tbl || "";
    renderPersonList(ciFilterMode === "table" ? ciFilterValue : "");
  }

  /* Search mode toggle */
  document.querySelectorAll('input[name="ciSearchMode"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      ciFilterMode = e.target.value;
      ciFilterValue = "";
      document.querySelector("#ciSearchByClub").style.display = ciFilterMode === "club" ? "" : "none";
      document.querySelector("#ciSearchByTable").style.display = ciFilterMode === "table" ? "" : "none";
      document.querySelector("#ciSearchByFree").style.display = ciFilterMode === "free" ? "" : "none";
      renderPersonList("");
    });
  });

  function renderPersonList(query) {
    const q = (query || "").toLowerCase();
    let filtered;
    if (ciFilterMode === "club" && q) {
      filtered = personList.filter((p) => p.club.toLowerCase() === q.toLowerCase());
    } else if (ciFilterMode === "table" && q) {
      filtered = personList.filter((p) => String(p.tableId) === q);
    } else if (ciFilterMode === "free" && q) {
      filtered = personList.filter((p) => p.name.toLowerCase().includes(q) || p.club.toLowerCase().includes(q) || String(p.tableId).includes(q) || `${p.tableId}番`.includes(q));
    } else {
      filtered = personList;
    }

    const listEl = document.getElementById("ciPersonList");
    if (!listEl) return;
    if (filtered.length === 0) {
      listEl.innerHTML = `<p class="mg-empty">該当する人物がありません</p>`;
      return;
    }

    let currentTable = null;
    let html = "";
    for (const p of filtered) {
      if (p.tableId !== currentTable) {
        if (currentTable !== null) html += "</div>";
        currentTable = p.tableId;
        html += `<div class="ci-table-group">
          <div class="ci-table-header">${escapeHtml(p.tableId)}番テーブル</div>
          <div class="ci-row ci-row-head" aria-hidden="true">
            <span></span><span>席</span><span>ロータリー</span><span>名前</span>
          </div>`;
      }
      const k = checkinKey(p.tableId, p.seat);
      const isSelected = !!checkinSelections[k];
      const alreadyCheckedIn = !!checkins[k];
      const displayName = p.personName || "";
      html += `
        <div class="ci-row person-row${isSelected ? " is-selected" : ""}${alreadyCheckedIn ? " is-checked-in" : ""}"
             data-ci-select data-ci-table="${escapeHtml(p.tableId)}" data-ci-seat="${p.seat}"
             data-ci-club="${escapeHtml(p.club)}" data-ci-name="${escapeHtml(p.name)}" data-ci-person="${escapeHtml(p.personName || "")}">
          ${isSelected || alreadyCheckedIn ? `<span class="check-mark"></span>` : `<span class="ci-person-unchecked"></span>`}
          <span class="ci-col-seat">${p.seat}</span>
          <span class="ci-col-club">${escapeHtml(p.club)}</span>
          <span class="ci-col-name">${displayName ? escapeHtml(displayName) : `<span class="ci-col-empty">—</span>`}</span>
        </div>`;
    }
    if (currentTable !== null) html += "</div>";
    listEl.innerHTML = html;
  }

  renderPersonList("");

  const ciSearchInput = document.getElementById("ciSearchInput");
  if (ciSearchInput) {
    ciSearchInput.addEventListener("input", (e) => {
      ciFilterValue = e.target.value;
      renderPersonList(e.target.value);
    });
  }

  app.addEventListener("click", (event) => {
    const row = event.target.closest("[data-ci-select]");
    if (row) {
      const tableId = row.dataset.ciTable;
      const seat = parseInt(row.dataset.ciSeat, 10);
      const club = row.dataset.ciClub;
      const name = row.dataset.ciName;
      const personName = row.dataset.ciPerson || "";
      checkinToggleSelect(tableId, seat, club, name, personName);
      const k = checkinKey(tableId, seat);
      const isSelected = !!checkinSelections[k];
      row.classList.toggle("is-selected", isSelected);
      const checkArea = row.querySelector(".check-mark, .ci-person-unchecked");
      if (checkArea) {
        if (isSelected || checkins[k]) {
          checkArea.className = "check-mark";
          checkArea.textContent = "";
        } else {
          checkArea.className = "ci-person-unchecked";
          checkArea.textContent = "";
        }
      }
      const actions = document.getElementById("ciActions");
      if (actions) actions.style.display = Object.keys(checkinSelections).length > 0 ? "" : "none";
    }
  }, { signal });

  const confirmBtn = document.getElementById("ciConfirmBtn");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      if (Object.keys(checkinSelections).length > 0) renderCheckinConfirm();
    });
  }
}

function showCheckinSuccessModal() {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-body">
      <div class="modal-icon"><span class="check-mark"></span></div>
      <div class="modal-title">登録しました</div>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="modalContinue" type="button">続けてチェックインする</button>
        <button class="btn btn-primary" id="modalHome" type="button">ホームに戻る</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById("modalContinue").addEventListener("click", () => {
    overlay.remove();
    checkinSelections = {};
    renderCheckin();
  });
  document.getElementById("modalHome").addEventListener("click", () => {
    overlay.remove();
    checkinSelections = {};
    renderHome();
  });
}

function renderCheckinConfirm() {
  setScreen("checkinConfirm");
  const selected = Object.values(checkinSelections);
  const checkins = loadCheckins();

  const newEntries = selected.filter((s) => !checkins[checkinKey(s.tableId, s.seat)]);
  const existingEntries = selected.filter((s) => !!checkins[checkinKey(s.tableId, s.seat)]);

  let html = `
    <h2 class="page-title">チェックイン確認</h2>
    <p class="ci-sub">選択: <strong>${selected.length}名</strong></p>
  `;

  function confirmRow(s, isExisting) {
    const displayName = s.personName || "";
    return `<div class="ci-row person-row${isExisting ? " is-checked-in" : ""}">
      ${isExisting ? `<span class="check-mark"></span>` : `<span style="width:22px;flex-shrink:0"></span>`}
      <span class="ci-col-seat">${s.seat}</span>
      <span class="ci-col-club">${escapeHtml(s.club)}</span>
      <span class="ci-col-name">${displayName ? escapeHtml(displayName) : `<span class="ci-col-empty">—</span>`}</span>
    </div>`;
  }

  if (newEntries.length > 0) {
    html += `<div class="ci-confirm-section">
      <div class="ci-confirm-label">新規チェックイン (${newEntries.length}名)</div>
      <div class="ci-row ci-row-head" aria-hidden="true"><span></span><span>席</span><span>ロータリー</span><span>名前</span></div>`;
    for (const s of newEntries) html += confirmRow(s, false);
    html += `</div>`;
  }

  if (existingEntries.length > 0) {
    html += `<div class="ci-confirm-section">
      <div class="ci-confirm-label ci-confirm-label-existing">チェックイン済み (${existingEntries.length}名)</div>
      <div class="ci-row ci-row-head" aria-hidden="true"><span></span><span>席</span><span>ロータリー</span><span>名前</span></div>`;
    for (const s of existingEntries) html += confirmRow(s, true);
    html += `</div>`;
  }

  html += `
    <div class="action-bar action-bar--inline action-bar--phone">
      ${existingEntries.length > 0 ? `<button class="btn btn-danger" id="ciUnregister" type="button">チェックイン解除</button>` : ""}
      <button class="btn btn-secondary" id="ciBackToSelect" type="button">選び直す</button>
      ${newEntries.length > 0 ? `<button class="btn btn-primary" id="ciRegister" type="button">チェックイン登録</button>` : ""}
    </div>

  `;

  app.innerHTML = html;

  document.getElementById("ciBackToSelect").addEventListener("click", renderCheckin);

  const registerBtn = document.getElementById("ciRegister");
  if (registerBtn) {
    registerBtn.addEventListener("click", () => {
      const data = loadCheckins();
      for (const s of newEntries) {
        data[checkinKey(s.tableId, s.seat)] = {
          tableId: s.tableId,
          seat: s.seat,
          club: s.club,
          name: s.name,
          timestamp: new Date().toISOString(),
        };
      }
      saveCheckins(data);
      showCheckinSuccessModal();
    });
  }

  const unregisterBtn = document.getElementById("ciUnregister");
  if (unregisterBtn) {
    unregisterBtn.addEventListener("click", () => {
      const data = loadCheckins();
      for (const s of existingEntries) {
        delete data[checkinKey(s.tableId, s.seat)];
      }
      saveCheckins(data);
      checkinSelections = {};
      renderCheckin();
    });
  }
}

/* ── Init ── */

if (typeof window.PERSON_NAMES_PAYLOAD !== "undefined") {
  applyPersonNamePayload(window.PERSON_NAMES_PAYLOAD);
}
renderHome();
loadPersonNamesFromApi().catch((err) => console.warn(err));
