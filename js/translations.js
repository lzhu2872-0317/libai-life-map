(function () {
  "use strict";

  const placeNames = {
    "碎叶城": "Suyab", "碎叶": "Suyab", "吉尔吉斯斯坦楚河州": "Chuy Region, Kyrgyzstan",
    "江油": "Jiangyou", "青莲乡": "Qinglian Township", "四川绵阳": "Mianyang, Sichuan",
    "平武": "Pingwu", "江油旁郡": "near Jiangyou", "剑阁": "Jiange", "四川广元": "Guangyuan, Sichuan",
    "三台": "Santai", "梓州": "Zizhou", "成都": "Chengdu", "益州": "Yizhou", "四川成都": "Chengdu, Sichuan",
    "峨眉山": "Mount Emei", "峨眉": "Emei", "四川乐山": "Leshan, Sichuan",
    "重庆": "Chongqing", "渝州": "Yuzhou", "江陵": "Jiangling", "荆州": "Jingzhou", "湖北荆州": "Jingzhou, Hubei",
    "洞庭湖": "Dongting Lake", "洞庭": "Dongting", "湖南岳阳": "Yueyang, Hunan",
    "南京": "Nanjing", "金陵": "Jinling", "江苏南京": "Nanjing, Jiangsu",
    "扬州": "Yangzhou", "广陵": "Guangling", "江苏扬州": "Yangzhou, Jiangsu",
    "洛阳": "Luoyang", "东都": "Eastern Capital", "河南洛阳": "Luoyang, Henan",
    "西安": "Xi'an", "长安": "Chang'an", "陕西西安": "Xi'an, Shaanxi",
    "商丘": "Shangqiu", "梁园": "Liangyuan", "河南商丘": "Shangqiu, Henan",
    "济宁": "Jining", "东鲁": "Donglu", "山东济宁": "Jining, Shandong",
    "宣城": "Xuancheng", "宣州": "Xuanzhou", "安徽宣城": "Xuancheng, Anhui",
    "庐山": "Mount Lu", "江西九江": "Jiujiang, Jiangxi", "九江": "Jiujiang", "浔阳": "Xunyang",
    "桐梓": "Tongzi", "夜郎方向": "toward Yelang", "贵州遵义": "Zunyi, Guizhou",
    "当涂": "Dangtu", "安徽马鞍山": "Ma'anshan, Anhui",
    "安陆": "Anlu", "武汉": "Wuhan", "登封": "Dengfeng", "襄阳": "Xiangyang",
    "杞县": "Qi County", "商州": "Shangzhou", "济南": "Jinan", "曲阜": "Qufu", "砀山": "Dangshan", "深州": "Shenzhou",
    "池州": "Chizhou", "兖州": "Yanzhou", "岳阳": "Yueyang", "宝应": "Baoying", "彬县": "Bin County",
    "单县": "Shan County", "定陶": "Dingtao", "华县": "Hua County", "怀远": "Huaiyuan", "淮阳": "Huaiyang",
    "黄陵": "Huangling", "黄石": "Huangshi", "南阳": "Nanyang", "邳州": "Pizhou", "嵊州": "Shengzhou",
    "苏州": "Suzhou", "随州": "Suizhou", "太原": "Taiyuan", "巫山": "Wushan", "荥阳": "Xingyang",
    "宜昌": "Yichang", "大兴": "Daxing", "丹阳": "Danyang", "汾阳": "Fenyang", "邯郸": "Handan",
    "杭州": "Hangzhou", "和县": "He County", "金乡": "Jinxiang", "泾县": "Jing County", "开封": "Kaifeng",
    "溧阳": "Liyang", "庐江": "Lujiang", "南昌": "Nanchang", "南陵": "Nanling", "潜山": "Qianshan",
    "青阳": "Qingyang", "绍兴": "Shaoxing", "宿松": "Susong", "太湖": "Taihu", "天台": "Tiantai",
    "魏县": "Wei County", "吴桥": "Wuqiao", "叶县": "Ye County", "宜兴": "Yixing", "永州": "Yongzhou",
    "镇江": "Zhenjiang", "三峡": "Three Gorges", "荆楚": "Jingchu", "吴越": "Wu-Yue", "江南": "Jiangnan",
    "中原": "Central Plains", "梁宋": "Liang-Song"
  };

  const placeIds = {
    "碎叶城": "suiye", "碎叶": "suiye", "江油": "jiangyou", "青莲乡": "jiangyou", "平武": "pingwu",
    "剑阁": "jiange", "三台": "zitong", "梓州": "zitong", "成都": "chengdu", "峨眉山": "emei", "峨眉": "emei",
    "重庆": "yuzhou", "渝州": "yuzhou", "江陵": "jiangling", "荆州": "jiangling", "洞庭湖": "dongting", "洞庭": "dongting",
    "南京": "jinling", "金陵": "jinling", "扬州": "yangzhou", "广陵": "yangzhou", "洛阳": "luoyang",
    "西安": "changan", "长安": "changan", "商丘": "liangyuan", "梁园": "liangyuan", "济宁": "donglu", "东鲁": "donglu",
    "宣城": "xuancheng", "宣州": "xuancheng", "庐山": "lushan", "九江": "xunyang", "浔阳": "xunyang",
    "桐梓": "ye_lang", "夜郎方向": "ye_lang", "当涂": "dangtu"
  };

  const assetLocationIds = new Set([
    "suiye", "jiangyou", "pingwu", "jiange", "zitong", "chengdu", "emei", "yuzhou", "jiangling", "dongting",
    "jinling", "yangzhou", "luoyang", "changan", "liangyuan", "donglu", "xuancheng", "lushan", "xunyang", "ye_lang", "dangtu"
  ]);

  const themes = {
    "山水自然": "Nature & Landscape",
    "行旅空间": "Travel Space",
    "离别酬赠": "Farewell & Gifts",
    "酒宴歌舞": "Wine & Banquets",
    "仕宦功名": "Official Ambition",
    "仙道超越": "Daoist Transcendence",
    "边塞战争": "Frontier War",
    "愁苦漂泊": "Sorrow & Drifting",
    "山水": "Landscape", "离蜀": "Leaving Shu", "行旅": "Travel", "送别": "Farewell",
    "长江": "Yangtze River", "交游": "Social Exchange", "月": "Moon", "乡愁": "Homesickness",
    "少年": "Youth", "蜀中": "Shu", "访道": "Daoist Visit", "游仙": "Immortal Wandering",
    "豪放": "Bold Spirit", "宴饮": "Wine and Feasting", "失意": "Frustration",
    "怀古": "Historical Reflection", "登临": "Scenic Ascent", "金陵": "Jinling",
    "登楼": "Tower Ascent", "怀才": "Unrecognized Talent", "奇观": "Spectacle",
    "遇赦": "Pardon", "速度": "Speed"
  };

  const imageryTerms = {
    "月": "Moon", "酒": "Wine", "山": "Mountain", "客": "Traveler", "愁": "Sorrow",
    "云": "Clouds", "江": "River", "白": "White", "三": "Three", "如": "As",
    "水": "Water", "时": "Time", "碧": "Jade-blue", "古": "Ancient", "倚": "Leaning",
    "流": "Flow", "花": "Flowers", "松": "Pine", "树": "Trees", "日": "Sun",
    "归": "Return", "风": "Wind", "生": "Life", "眉": "Emei", "碎": "Fragments",
    "作": "Writing", "书": "Letters", "天": "Sky", "长": "Long", "清": "Clear",
    "海": "Sea", "子": "Master", "东": "East", "金": "Gold", "高": "High",
    "秋": "Autumn", "见": "Seen", "落": "Falling", "远": "Distant", "心": "Heart",
    "行": "Travel", "明": "Bright", "出": "Departure", "空": "Empty", "入": "Entering",
    "紫": "Purple", "道": "Dao", "青": "Blue-green", "草": "Grass", "玉": "Jade",
    "飞": "Flight", "人": "People", "君": "You", "何": "Why", "上": "Above",
    "去": "Departing", "此": "Here", "有": "Having", "中": "Within", "相": "Mutual",
    "一": "One", "来": "Coming", "无": "Without", "为": "For", "不": "Not"
  };

  const stages = {
    "第一时期：蜀中少年期": "Stage 1: Youth in Shu",
    "第二时期：出蜀与漫游期": "Stage 2: Leaving Shu and Wandering",
    "第三时期：长安时期": "Stage 3: Chang'an Period",
    "第四时期：放还、乱离与晚年期": "Stage 4: Exile, Turmoil, and Late Years"
  };

  const periods = {
    "出生传说": "Birth Legend", "蜀中少年": "Youth in Shu", "蜀中漫游": "Travels in Shu",
    "蜀中早游": "Early Travels in Shu", "蜀道行旅": "Travels along the Shu Roads",
    "从学纵横": "Study of Political Strategy", "仗剑去国": "Leaving Shu with a Sword",
    "沿江东下": "Downriver to the East", "荆楚往还": "Jingchu Journeys", "楚地漫游": "Travels in Chu",
    "江南行旅": "Jiangnan Travels", "吴越漫游": "Wu-Yue Travels", "中原交游": "Central Plains Networks",
    "供奉翰林": "Hanlin Service", "梁宋交游": "Liang-Song Friendships", "东鲁家居": "Residence in Donglu",
    "江南晚游": "Late Jiangnan Travels", "入幕永王": "Service under Prince Yong",
    "系狱与流放": "Imprisonment and Exile", "长流夜郎": "Long Exile toward Yelang",
    "晚年终老": "Final Years", "李白行迹": "Li Bai Itinerary", "Poetic Composition Site": "Poetic Composition Site"
  };

  const genres = {
    "诗": "Poem", "文": "Prose", "作品": "Work", "七言绝句": "Seven-character quatrain",
    "五言绝句": "Five-character quatrain", "五言律诗": "Five-character regulated verse",
    "五言诗": "Five-character poem", "七言律诗": "Seven-character regulated verse",
    "杂言古诗": "Mixed-line old-style poem", "乐府": "Yuefu"
  };

  const locationSummaries = {
    suiye: "Traditional accounts place Li Bai's birth near Suyab in the Western Regions; his family later moved into Shu.",
    jiangyou: "Li Bai spent much of his childhood and youth in the Shu region; Qinglian Township is often treated as his formative home.",
    chengdu: "Chengdu was the cultural and political center of Shu, representing Li Bai's learning and social world before he left the region.",
    pingwu: "Pingwu marks an early Shu-region travel node near Jiangyou.",
    jiange: "Jiange was a major point on the Shu Roads and helps show the range of Li Bai's early travels.",
    zitong: "The Zizhou area is linked with accounts of Li Bai studying political strategy with Zhao Rui.",
    emei: "Song of Mount Emei's Moon connects Shu landscapes, homesickness, and the Yangtze journey.",
    yuzhou: "Chongqing/Yuzhou was an important river-route node as Li Bai left Shu and moved eastward.",
    jiangling: "Jiangling was a key node in Li Bai's river journeys and later in his return after receiving a pardon.",
    dongting: "The Dongting Lake region carries Li Bai's Chu travels and farewell themes.",
    jinling: "Jinling/Nanjing was one of Li Bai's repeatedly written Jiangnan cities, associated with memory, scenic ascent, and friendship.",
    yangzhou: "Yangzhou/Guangling was an important site for Li Bai's farewell poetry and Jianghuai social exchanges.",
    luoyang: "Luoyang connects Li Bai's Central Plains networks with the political-cultural routes around Chang'an.",
    changan: "In the Tianbao era, Li Bai entered Chang'an for Hanlin service, reaching great fame while also facing political frustration.",
    liangyuan: "After leaving Chang'an, Li Bai traveled through the Liang-Song area with Du Fu, Gao Shi, and other friends.",
    donglu: "Donglu/Jining was an important middle-life residence and family area for Li Bai.",
    xuancheng: "Xuancheng/Xuanzhou preserves many of Li Bai's late poems of ascent, farewell, and historical reflection.",
    lushan: "Mount Lu was both a landscape-poetry site and a clue to Li Bai's fate after the An Lushan Rebellion.",
    xunyang: "After the Prince Yong affair, Li Bai was imprisoned at Xunyang and later sentenced to long exile toward Yelang.",
    ye_lang: "Yelang is the symbolic destination of Li Bai's exile sentence; he received a pardon on the way and may not have reached it.",
    dangtu: "In his final years, Li Bai stayed with his kinsman Li Yangbing and died at Dangtu, where his itinerary closes in Jiangdong."
  };

  const eventTranslations = {
    e701: ["Birth of Li Bai", "According to traditional accounts, Li Bai was born near Suyab in the Western Regions.", "This point marks the start of the itinerary; Li Bai's exact birthplace remains debated."],
    e705: ["Move to Shu", "As a child, Li Bai moved with his family to Qinglian Township in Changlong, Mianzhou.", "The Shu years shaped Li Bai's early cultural memory and landscape experience."],
    e706: ["Living in Shu with His Father", "Li Bai lived with his father in Shu.", "From 706 to 709, Li Bai lived around Jiangyou in Shu."],
    e710: ["Classical Study", "Li Bai studied the Book of Songs, the Book of Documents, and the Hundred Schools.", "In 710, the young Li Bai studied the classics and early philosophers, laying the foundation for his later literary range."],
    e715: ["Youthful Reading and Knight-Errant Ideals", "Tradition describes the young Li Bai as widely read, skilled with the sword, and drawn to a bold self-image.", "This node connects Qinglian, early ambition, and Li Bai's Shu activities."],
    "e718-pingwu": ["Nearby Prefecture Travel", "Li Bai traveled around nearby prefectures and Jiangyou, leaving poems for friends.", "In 718, at about eighteen, Li Bai traveled around Jiangyou and Pingwu."],
    "e718-jiange": ["Jiange Journey", "Li Bai traveled around Jiangyou, Jiange, and nearby places.", "Jiange was a strategic Shu Roads site; this node shows Li Bai's early travel range."],
    "e718-zitong": ["Santai and Zizhou", "Li Bai visited Zizhou and studied political strategy with Zhao Rui.", "Around 718, Li Bai traveled to Zizhou and encountered the tradition of political strategy."],
    e719: ["Visit to a Daoist on Daitian Mountain", "Li Bai visited a Daoist on Daitian Mountain but did not meet him, leaving a poem.", "The failed visit helped form Li Bai's early Daoist and landscape imagination."],
    e720: ["Social Travel in Shu", "His activities expanded to Chengdu and nearby areas.", "Chengdu functions here as the Shu cultural center before Li Bai's departure."],
    e724: ["Preparing to Leave Shu", "Li Bai gradually turned toward wider travel and official ambition.", "This node links Jiangyou with the later route through Emei, Yuzhou, and Jiangling."],
    e725: ["Leaving Shu for Distant Travel", "Li Bai left Shu and traveled east along the Yangtze.", "Song of Mount Emei's Moon is often used as a literary coordinate for this journey."],
    e727: ["Travels through Jingchu and Jiangnan", "Li Bai entered Chu and Jiangnan, and his travel sites multiplied.", "This stage links Dongting, Jinling, Yangzhou, and other poetry locations."],
    e728: ["Farewell at Guangling", "Yangzhou/Guangling became an important geographical image in Li Bai's farewell poetry.", "Yellow Crane Tower: Farewell to Meng Haoran on His Way to Guangling connects the Jianghan and Jianghuai routes."],
    e734: ["Seeking Office in the Central Plains", "Li Bai built political and cultural networks around Luoyang and Chang'an.", "Luoyang serves as a Central Plains network node in this map."],
    e736: ["Residence in Donglu", "Donglu became an important middle-life residence for Li Bai.", "This node connects Shandong, family life, and Central Plains travel."],
    e742: ["Summoned to Chang'an", "Li Bai entered Chang'an for Hanlin service and reached a peak of fame.", "Chang'an is one of the major highlighted nodes in the interactive system."],
    e744: ["Dismissed with Imperial Gold", "Li Bai left Chang'an after political frustration.", "The route turns from Chang'an toward Liang-Song, Donglu, and Jiangnan."],
    "e744-dufu": ["Meeting Du Fu and Gao Shi in Liang-Song", "Li Bai, Du Fu, and Gao Shi traveled together in the Liang-Song area.", "This node supports the links between people and place cards."],
    e748: ["Return to Jinling", "Poems of historical reflection, scenic ascent, and farewell cluster around Jinling.", "This connects On Climbing the Phoenix Terrace at Jinling with the Jinling place detail."],
    e753: ["Scenic Ascent in Xuanzhou", "Xuancheng and Xie Tiao Tower became frequent late-period poetic scenes.", "This node drives the poem cards and map zoom for Xuancheng."],
    e756: ["Joining Prince Yong during the Rebellion", "A political choice in a time of disorder changed Li Bai's late life.", "Mount Lu and Xunyang are used to connect the consequences of the Prince Yong affair."],
    e757: ["Imprisoned at Xunyang", "Li Bai was implicated in the Prince Yong affair and imprisoned at Xunyang.", "The Xunyang node switches to a warning color and triggers the exile route segment."],
    e758: ["Long Exile toward Yelang", "Li Bai was sentenced to long exile toward Yelang and moved southwest along the river routes.", "The route is shown with subdued styling on the map."],
    e759: ["Pardoned on the Road", "Li Bai received a pardon near Baidi and returned east to Jiangling.", "This links Early Departure from Baidi City with a route animation turning back along the Yangtze."],
    e762: ["Death at Dangtu", "In his final years, Li Bai stayed with Li Yangbing and died at Dangtu.", "The timeline ends by focusing the map on Jiangdong."]
  };

  const profile = {
    name: "Li Bai",
    courtesyName: "Taibai",
    alias: "Qinglian Jushi",
    dynasty: "Tang",
    summary: "Li Bai was one of the representative poets of the High Tang. His itinerary crossed Shu, Jingchu, Jiangnan, the Central Plains, Chang'an, Donglu, and late-life exile routes. This project links maps, timelines, poem cards, and place details to present the core movements of his life.",
    keywords: ["High Tang", "Travel", "Landscape", "Daoist Imagination", "Farewell", "Historical Reflection"],
    routeDistanceLabel: "over ten thousand li"
  };

  const relationshipTranslations = {
    "杜甫": ["Du Fu", "Poet friend", "Around the third Tianbao year, Li Bai traveled with Du Fu and Gao Shi in the Liang-Song area."],
    "高适": ["Gao Shi", "Poet friend", "An important figure in the Liang-Song social and literary network."],
    "孟浩然": ["Meng Haoran", "Senior poet friend", "Yellow Crane Tower: Farewell to Meng Haoran on His Way to Guangling expresses respect and parting sorrow."],
    "贺知章": ["He Zhizhang", "Admirer", "Tradition says He Zhizhang praised Li Bai as an 'exiled immortal,' strengthening his reputation in Chang'an."],
    "李阳冰": ["Li Yangbing", "Kinsman", "Li Bai stayed with Li Yangbing in his final years; Li Yangbing later edited his writings."]
  };

  const chapterTranslations = {
    c1: ["Youth in Shu", "From birth legends to the Qinglian formative home, the Shu years shaped Li Bai's landscape experience, knight-errant temperament, and longing for distant travel."],
    c2: ["Sword-Bearing Travels", "After leaving Shu, Li Bai moved east along the Yangtze into Jingchu, Jiangnan, and Central Plains networks, rapidly expanding his poetic geography."],
    c3: ["Chang'an Zenith", "Summoned to Chang'an for Hanlin service, Li Bai became famous in the capital but also met political frustration."],
    c4: ["Renewed Jianghu Travels", "After leaving the capital, Li Bai returned to travel and friendship; Liang-Song, Donglu, and Jiangnan became dense activity zones."],
    c5: ["Exile and Final Years", "After the Prince Yong affair, Li Bai was imprisoned and sentenced to exile toward Yelang; he was pardoned on the way and spent his final years in Jiangdong."],
    "cnk-like": ["Li Bai Itinerary Data", "A local data sample modeled on the target site's field structure."]
  };

  const poemSummaries = {
    "p-emei": "The moonlight of Mount Emei opens the spatial narrative of leaving Shu and traveling east.",
    "p-guangling": "The destination Guangling points to Yangzhou, showing the poetic traffic from Jianghan to Jianghuai.",
    "p-jingyesi": "Used as a sample of hometown imagery linked to Qinglian, Li Bai's formative place.",
    "p-chuyue": "A local sample for early-life work cards, centered on moonlit youth in Shu.",
    "p-yuhou": "A sample of early moonlit landscape poetry from Shu.",
    "p-fangdaoshi": "A failed Daoist visit connected with Li Bai's early event record.",
    "p-jiangjinjiu": "Used to show the mingled idealism and frustration around the Chang'an years.",
    "p-fenghuangtai": "A representative poem of historical reflection at Jinling.",
    "p-xietiao": "The Xie Tiao Tower scene brings out late emotion and Jiangnan scenic ascent.",
    "p-lushan": "A highly recognizable sample of Mount Lu poetic geography.",
    "p-baidi": "A route poem of the pardoned return eastward, linking Jiangling with the Yangtze waterways."
  };

  const exactText = {
    "李白行迹地图": "Li Bai Life Map",
    "李白诗词地理样本": "Li Bai Poetry Geography Samples",
    "用于地图联动的精选样本，非全集。": "Selected samples for linked map interactions, not a complete corpus.",
    "李白生平时间线": "Li Bai Life Timeline",
    "蜀中成长圈": "Shu Formative Region",
    "江南创作密集区": "Jiangnan Writing Cluster",
    "用于本地复刻页面的李白主题地点、路线、GeoJSON 与创作分布数据。": "Li Bai-themed places, routes, GeoJSON regions, and writing distribution data for the local reconstructed page.",
    "目标站字段结构的本地同构数据。": "Local data modeled on the target site's field structure.",
    "由同构数据转换。": "Converted from locally modeled data.",
    "本地同构样本，未复制目标站原文。": "Local modeled sample; no source-site text copied.",
    "本地样本": "Local sample",
    "唐": "Tang",
    "盛唐": "High Tang",
    "行迹": "Itinerary",
    "编年": "Chronology",
    "诗作": "Poems",
    "地图": "Map"
  };

  function hasHan(value) {
    return /[\u3400-\u9fff]/.test(String(value || ""));
  }

  function slugify(value) {
    return String(value || "unknown")
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "unknown";
  }

  function replaceKnown(value, dict) {
    let text = String(value ?? "");
    Object.keys(dict)
      .sort((a, b) => b.length - a.length)
      .forEach((key) => {
        text = text.replaceAll(key, dict[key]);
      });
    return text;
  }

  function placeName(value) {
    const text = String(value ?? "").trim();
    if (!text) return "";
    if (placeNames[text]) return placeNames[text];
    return replaceKnown(text, placeNames)
      .replace(/（/g, " (")
      .replace(/）/g, ")")
      .replace(/；/g, "; ")
      .replace(/，/g, ", ")
      .replace(/、/g, ", ");
  }

  function placeId(value) {
    const text = String(value ?? "").trim();
    if (placeIds[text]) return placeIds[text];
    return slugify(placeName(text));
  }

  function placeImage(id) {
    return assetLocationIds.has(id) ? `assets/images/location-${id}.svg` : "assets/icons/marker.svg";
  }

  function theme(value) {
    const text = String(value ?? "").trim();
    if (!text) return "";
    return themes[text] || replaceKnown(text, themes);
  }

  function imageryTerm(value) {
    const text = String(value ?? "").trim();
    if (!text) return "";
    return imageryTerms[text] || themes[text] || text;
  }

  function stage(value) {
    return stages[value] || value;
  }

  function period(value) {
    return periods[value] || replaceKnown(value, periods);
  }

  function genre(value) {
    return genres[value] || value;
  }

  function listWithCounts(value, translator) {
    return String(value ?? "")
      .split(";")
      .map((part) => {
        const trimmed = part.trim();
        if (!trimmed) return "";
        const [label, count] = trimmed.split(":");
        return count === undefined ? translator(label.trim()) : `${translator(label.trim())}:${count.trim()}`;
      })
      .filter(Boolean)
      .join("; ");
  }

  function mainPlaces(value) {
    return listWithCounts(value, placeName);
  }

  function themeDensity(value) {
    return listWithCounts(value, theme);
  }

  function genericText(value) {
    if (value == null || value === "") return value;
    const text = String(value);
    if (exactText[text]) return exactText[text];
    return replaceKnown(replaceKnown(replaceKnown(text, exactText), themes), placeNames)
      .replace(/年/g, " AD")
      .replace(/；/g, "; ")
      .replace(/：/g, ": ")
      .replace(/，/g, ", ")
      .replace(/。/g, ".")
      .replace(/、/g, ", ");
  }

  function localizeLocations(locationsData) {
    if (!locationsData) return;
    if (locationsData.meta) {
      locationsData.meta.title = "Li Bai Life Map";
      if (locationsData.meta.description) locationsData.meta.description = genericText(locationsData.meta.description);
    }
    (locationsData.locations || []).forEach((location) => {
      location.name = placeName(location.name);
      location.ancientName = placeName(location.ancientName);
      location.province = placeName(location.province);
      location.period = period(location.period);
      location.summary = locationSummaries[location.id] || genericText(location.summary);
    });
    (locationsData.geojson?.features || []).forEach((feature) => {
      if (feature.properties?.name) feature.properties.name = genericText(feature.properties.name);
    });
  }

  function localizeTimeline(timeline) {
    if (!timeline) return;
    if (timeline.meta) timeline.meta.title = "Li Bai Life Timeline";
    (timeline.events || []).forEach((event) => {
      const exact = eventTranslations[event.id];
      if (exact) {
        [event.title, event.summary, event.detail] = exact;
        return;
      }
      event.title = genericText(event.title);
      event.summary = genericText(event.summary);
      event.detail = genericText(event.detail);
    });
  }

  function localizePoems(poemsData) {
    if (!poemsData) return;
    if (poemsData.meta) {
      poemsData.meta.title = "Li Bai Poetry Geography Samples";
      if (poemsData.meta.note) poemsData.meta.note = genericText(poemsData.meta.note);
    }
    (poemsData.poems || []).forEach((poem) => {
      poem.genre = genre(poem.genre);
      poem.theme = (poem.theme || []).map(theme);
      poem.summary = poemSummaries[poem.id] || genericText(poem.summary);
    });
    (poemsData.themes || []).forEach((item) => {
      item.name = theme(item.name);
    });
  }

  function localizeBiography(biography) {
    if (!biography) return;
    if (biography.profile) {
      biography.profile.name = profile.name;
      biography.profile.courtesyName = profile.courtesyName;
      biography.profile.alias = profile.alias;
      biography.profile.dynasty = profile.dynasty;
      biography.profile.summary = profile.summary;
      biography.profile.keywords = profile.keywords;
      if (biography.profile.stats?.routeDistanceLabel) biography.profile.stats.routeDistanceLabel = profile.routeDistanceLabel;
    }
    (biography.relationships || []).forEach((relation) => {
      const exact = relationshipTranslations[relation.name];
      if (exact) {
        [relation.name, relation.relation, relation.summary] = exact;
      } else {
        relation.name = genericText(relation.name);
        relation.relation = genericText(relation.relation);
        relation.summary = genericText(relation.summary);
      }
    });
    (biography.chapters || []).forEach((chapter) => {
      const exact = chapterTranslations[chapter.id];
      if (exact) {
        [chapter.title, chapter.summary] = exact;
      } else {
        chapter.title = genericText(chapter.title);
        chapter.summary = genericText(chapter.summary);
      }
    });
  }

  function localizeTeiData(tei) {
    if (!tei) return;
    (tei.summaryRows || []).forEach((row) => {
      row.chinese_stage = stage(row.chinese_stage);
      row.main_places = mainPlaces(row.main_places);
      row.top_themes_per_100_chars = themeDensity(row.top_themes_per_100_chars);
    });
    (tei.densityRows || []).forEach((row) => {
      row.chinese_stage = stage(row.chinese_stage);
      row.theme = theme(row.theme);
    });
    (tei.stages || []).forEach((teiStage) => {
      (teiStage.poems || []).forEach((poem) => {
        if (hasHan(poem.locationName)) {
          poem.locationId = placeId(poem.locationName);
          poem.locationName = placeName(poem.locationName);
        }
        poem.theme = (poem.theme || []).map(theme);
        poem.summary = `${poem.year || teiStage.years}, ${poem.locationName}, ${(poem.theme || []).slice(0, 4).join(" / ")}`;
      });
    });
  }

  function localizeData(data) {
    if (!data) return data;
    localizeLocations(data.locations);
    localizeTimeline(data.timeline);
    localizePoems(data.poems);
    localizeBiography(data.biography);
    localizeTeiData(data.tei);
    return data;
  }

  window.LiBaiTranslations = {
    hasHan,
    placeName,
    placeId,
    placeImage,
    theme,
    imageryTerm,
    stage,
    period,
    genre,
    mainPlaces,
    themeDensity,
    genericText,
    localizeData
  };
})();
