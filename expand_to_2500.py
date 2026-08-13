import json

with open('gemini_hsk5_data.js', 'r', encoding='utf-8') as f:
    text = f.read()

start_marker = 'const GEMINI_HSK5_DATA = '
end_marker = ';\n'

json_str = text[text.find(start_marker) + len(start_marker):text.rfind(end_marker)]
words = json.loads(json_str)

existing_chinese = {w['chinese'] for w in words}
print(f"Current count: {len(words)}")

extra_words = [
    {"chinese": "两", "pinyin": "liǎng", "type": "Số từ", "meaning": "hai (dùng với lượng từ)"},
    {"chinese": "亮", "pinyin": "liàng", "type": "Tính từ", "meaning": "sáng, tỏa sáng"},
    {"chinese": "辆", "pinyin": "liàng", "type": "Lượng từ", "meaning": "chiếc (xe)"},
    {"chinese": "聊天", "pinyin": "liáotiān", "type": "Động từ", "meaning": "tán gẫu, trò chuyện"},
    {"chinese": "了解", "pinyin": "liǎojiě", "type": "Động từ", "meaning": "hiểu rõ, tìm hiểu"},
    {"chinese": "邻居", "pinyin": "línjū", "type": "Danh từ", "meaning": "hàng xóm"},
    {"chinese": "零", "pinyin": "líng", "type": "Số từ", "meaning": "số 0"},
    {"chinese": "另外", "pinyin": "lìngwài", "type": "Liên từ", "meaning": "ngoài ra, khác"},
    {"chinese": "留", "pinyin": "liú", "type": "Động từ", "meaning": "ở lại, lưu giữ"},
    {"chinese": "留学", "pinyin": "liúxué", "type": "Động từ", "meaning": "du học"},
    {"chinese": "流利", "pinyin": "liúlì", "type": "Tính từ", "meaning": "lưu loát, trôi chảy"},
    {"chinese": "流行", "pinyin": "liúxíng", "type": "Tính từ", "meaning": "thịnh hành, phổ biến"},
    {"chinese": "六", "pinyin": "liù", "type": "Số từ", "meaning": "số 6"},
    {"chinese": "楼", "pinyin": "lóu", "type": "Danh từ", "meaning": "tòa nhà, tầng lầu"},
    {"chinese": "路", "pinyin": "lù", "type": "Danh từ", "meaning": "con đường"},
    {"chinese": "乱", "pinyin": "luàn", "type": "Tính từ", "meaning": "bừa bộn, lộn xộn"},
    {"chinese": "旅游", "pinyin": "lǚyóu", "type": "Động từ", "meaning": "du lịch"},
    {"chinese": "绿", "pinyin": "lǜ", "type": "Tính từ", "meaning": "xanh lá cây"},
    {"chinese": "律师", "pinyin": "lǜshī", "type": "Danh từ", "meaning": "luật sư"},
    {"chinese": "妈妈", "pinyin": "māma", "type": "Danh từ", "meaning": "mẹ, má"},
    {"chinese": "麻烦", "pinyin": "máfan", "type": "Tính từ", "meaning": "phiền phức, làm phiền"},
    {"chinese": "马", "pinyin": "mǎ", "type": "Danh từ", "meaning": "con ngựa"},
    {"chinese": "马上", "pinyin": "mǎshàng", "type": "Trạng từ", "meaning": "ngay lập tức"},
    {"chinese": "买", "pinyin": "mǎi", "type": "Động từ", "meaning": "mua"},
    {"chinese": "卖", "pinyin": "mài", "type": "Động từ", "meaning": "bán"},
    {"chinese": "满", "pinyin": "mǎn", "type": "Tính từ", "meaning": "đầy, mãn nguyện"},
    {"chinese": "满意", "pinyin": "mǎnyì", "type": "Tính từ", "meaning": "hài lòng, thỏa mãn"},
    {"chinese": "慢", "pinyin": "màn", "type": "Tính từ", "meaning": "chậm"},
    {"chinese": "忙", "pinyin": "máng", "type": "Tính từ", "meaning": "bận rộn"},
    {"chinese": "猫", "pinyin": "māo", "type": "Danh từ", "meaning": "con mèo"},
    {"chinese": "毛", "pinyin": "máo", "type": "Lượng từ", "meaning": "hào (tiền); lông"},
    {"chinese": "毛巾", "pinyin": "máojīn", "type": "Danh từ", "meaning": "khăn mặt"},
    {"chinese": "帽子", "pinyin": "màozi", "type": "Danh từ", "meaning": "cái mũ, nón"},
    {"chinese": "没", "pinyin": "méi", "type": "Trạng từ", "meaning": "không, chưa"},
    {"chinese": "没关系", "pinyin": "méi guānxi", "type": "Cụm từ", "meaning": "không sao đâu"},
    {"chinese": "美好", "pinyin": "měihǎo", "type": "Tính từ", "meaning": "đẹp đẽ, tốt đẹp"},
    {"chinese": "美丽", "pinyin": "měilì", "type": "Tính từ", "meaning": "xinh đẹp, mỹ lệ"},
    {"chinese": "梦", "pinyin": "mèng", "type": "Danh từ", "meaning": "giấc mơ, mơ thấy"},
    {"chinese": "门", "pinyin": "mén", "type": "Danh từ", "meaning": "cánh cửa"},
    {"chinese": "米", "pinyin": "mǐ", "type": "Danh từ", "meaning": "gạo; mét"},
    {"chinese": "米饭", "pinyin": "mǐfàn", "type": "Danh từ", "meaning": "cơm trắng"},
    {"chinese": "密码", "pinyin": "mìmǎ", "type": "Danh từ", "meaning": "mật khẩu"},
    {"chinese": "免费", "pinyin": "miǎnfèi", "type": "Tính từ", "meaning": "miễn phí"},
    {"chinese": "面包", "pinyin": "miànbāo", "type": "Danh từ", "meaning": "bánh mì"},
    {"chinese": "面条", "pinyin": "miàntiáo", "type": "Danh từ", "meaning": "mì sợi"},
    {"chinese": "民族", "pinyin": "mínzú", "type": "Danh từ", "meaning": "dân tộc"},
    {"chinese": "明白", "pinyin": "míngbai", "type": "Động từ", "meaning": "hiểu rõ, rõ ràng"},
    {"chinese": "明确", "pinyin": "míngquè", "type": "Tính từ", "meaning": "rõ ràng, dứt khoát"},
    {"chinese": "明天", "pinyin": "míngtiān", "type": "Danh từ", "meaning": "ngày mai"},
    {"chinese": "名字", "pinyin": "míngzi", "type": "Danh từ", "meaning": "tên gọi"},
    {"chinese": "目的", "pinyin": "mùdì", "type": "Danh từ", "meaning": "mục đích"},
    {"chinese": "拿", "pinyin": "ná", "type": "Động từ", "meaning": "cầm, lấy"},
    {"chinese": "哪", "pinyin": "nǎ", "type": "Đại từ", "meaning": "nào, đâu"},
    {"chinese": "哪儿", "pinyin": "nǎr", "type": "Đại từ", "meaning": "ở đâu, chỗ nào"},
    {"chinese": "那", "pinyin": "nà", "type": "Đại từ", "meaning": "kia, đó"},
    {"chinese": "奶奶", "pinyin": "nǎinai", "type": "Danh từ", "meaning": "bà nội"},
    {"chinese": "耐烦", "pinyin": "nàifán", "type": "Tính từ", "meaning": "kiên nhẫn"},
    {"chinese": "耐心", "pinyin": "nàixīn", "type": "Tính từ", "meaning": "nhẫn nại, lòng kiên nhẫn"},
    {"chinese": "南", "pinyin": "nán", "type": "Danh từ", "meaning": "phía nam, miền nam"},
    {"chinese": "难", "pinyin": "nán", "type": "Tính từ", "meaning": "khó"},
    {"chinese": "难过", "pinyin": "nánguò", "type": "Tính từ", "meaning": "buồn rầu, khó khăn"},
    {"chinese": "难受", "pinyin": "nánshòu", "type": "Tính từ", "meaning": "khó chịu, đau buồn"},
    {"chinese": "男", "pinyin": "nán", "type": "Tính từ", "meaning": "nam, đàn ông"},
    {"chinese": "脑袋", "pinyin": "nǎodai", "type": "Danh từ", "meaning": "đầu, bộ não"},
    {"chinese": "呢", "pinyin": "ne", "type": "Trợ từ", "meaning": "thì sao, đây"},
    {"chinese": "内", "pinyin": "nèi", "type": "Danh từ", "meaning": "bên trong, trong"},
    {"chinese": "内容", "pinyin": "nèiróng", "type": "Danh từ", "meaning": "nội dung"},
    {"chinese": "能", "pinyin": "néng", "type": "Động từ", "meaning": "có thể, làm được"},
    {"chinese": "能力", "pinyin": "nénglì", "type": "Danh từ", "meaning": "năng lực, khả năng"},
    {"chinese": "能干", "pinyin": "nénggàn", "type": "Tính từ", "meaning": "giỏi giang, tháo vát"},
    {"chinese": "你", "pinyin": "nǐ", "type": "Đại từ", "meaning": "bạn, anh, chị"},
    {"chinese": "年", "pinyin": "nián", "type": "Danh từ", "meaning": "năm"},
    {"chinese": "年代", "pinyin": "niándài", "type": "Danh từ", "meaning": "thập kỷ, thời đại"},
    {"chinese": "年纪", "pinyin": "niánjì", "type": "Danh từ", "meaning": "tuổi tác"},
    {"chinese": "年级", "pinyin": "niánjí", "type": "Danh từ", "meaning": "lớp, năm học"},
    {"chinese": "年轻", "pinyin": "niánqīng", "type": "Tính từ", "meaning": "trẻ tuổi, thanh xuân"},
    {"chinese": "念", "pinyin": "niàn", "type": "Động từ", "meaning": "đọc, nhớ nhung"},
    {"chinese": "鸟", "pinyin": "niǎo", "type": "Danh từ", "meaning": "con chim"},
    {"chinese": "您", "pinyin": "nín", "type": "Đại từ", "meaning": "ngài, ông/bà"},
    {"chinese": "牛奶", "pinyin": "niúnǎi", "type": "Danh từ", "meaning": "sữa bò"},
    {"chinese": "农村", "pinyin": "nóngcūn", "type": "Danh từ", "meaning": "nông thôn, làng quê"},
    {"chinese": "农民", "pinyin": "nóngmín", "type": "Danh từ", "meaning": "nông dân"},
    {"chinese": "浓", "pinyin": "nóng", "type": "Tính từ", "meaning": "đậm, đặc"},
    {"chinese": "努力", "pinyin": "nǔlì", "type": "Tính từ", "meaning": "nỗ lực, cố gắng"},
    {"chinese": "暖和", "pinyin": "nuǎnhuo", "type": "Tính từ", "meaning": "ấm áp"},
    {"chinese": "偶尔", "pinyin": "ǒu'ěr", "type": "Trạng từ", "meaning": "thỉnh thoảng, ngẫu nhiên"},
    {"chinese": "爬山", "pinyin": "páshān", "type": "Động từ", "meaning": "leo núi"},
    {"chinese": "排列", "pinyin": "páiliè", "type": "Động từ", "meaning": "sắp xếp, xếp hàng"},
    {"chinese": "盘子", "pinyin": "pánzi", "type": "Danh từ", "meaning": "cái đĩa"},
    {"chinese": "判断", "pinyin": "pànduàn", "type": "Động từ", "meaning": "phán đoán, nhận định"},
    {"chinese": "胖", "pinyin": "pàng", "type": "Tính từ", "meaning": "béo, mập"},
    {"chinese": "跑步", "pinyin": "pǎobù", "type": "Động từ", "meaning": "chạy bộ"},
    {"chinese": "陪", "pinyin": "péi", "type": "Động từ", "meaning": "đi cùng, đồng hành"},
    {"chinese": "朋友", "pinyin": "péngyou", "type": "Danh từ", "meaning": "bạn bè"},
    {"chinese": "批评", "pinyin": "pīpíng", "type": "Động từ", "meaning": "phê bình, chỉ trích"},
    {"chinese": "皮肤", "pinyin": "pífū", "type": "Danh từ", "meaning": "làn da"},
    {"chinese": "啤酒", "pinyin": "píjiǔ", "type": "Danh từ", "meaning": "bia"},
    {"chinese": "脾气", "pinyin": "píqi", "type": "Danh từ", "meaning": "tính khí, tính tình"},
    {"chinese": "篇", "pinyin": "piān", "type": "Lượng từ", "meaning": "bài (văn, báo)"},
    {"chinese": "便宜", "pinyin": "piányi", "type": "Tính từ", "meaning": "rẻ"},
    {"chinese": "骗", "pinyin": "piàn", "type": "Động từ", "meaning": "lừa gạt, lừa dối"},
    {"chinese": "票", "pinyin": "piào", "type": "Danh từ", "meaning": "vé, phiếu"},
    {"chinese": "漂亮", "pinyin": "piàoliang", "type": "Tính từ", "meaning": "xinh đẹp, đẹp đẽ"},
    {"chinese": "乒乓球", "pinyin": "pīngpāngqiú", "type": "Danh từ", "meaning": "bóng bàn"},
    {"chinese": "苹果", "pinyin": "píngguǒ", "type": "Danh từ", "meaning": "quả táo"},
    {"chinese": "平时", "pinyin": "píngshí", "type": "Danh từ", "meaning": "ngày thường, bình thường"},
    {"chinese": "瓶子", "pinyin": "píngzi", "type": "Danh từ", "meaning": "cái chai, bình"},
    {"chinese": "破", "pinyin": "pò", "type": "Tính từ", "meaning": "rách, hỏng, vỡ"},
    {"chinese": "葡萄", "pinyin": "pútao", "type": "Danh từ", "meaning": "quả nho"},
    {"chinese": "普遍", "pinyin": "pǔbiàn", "type": "Tính từ", "meaning": "phổ biến, chung"},
    {"chinese": "普通话", "pinyin": "pǔtōnghuà", "type": "Danh từ", "meaning": "tiếng Phổ thông"}
]

for item in extra_words:
    if item['chinese'] not in existing_chinese:
        existing_chinese.add(item['chinese'])
        words.append(item)

# Sort words by chinese
words.sort(key=lambda x: x['chinese'])

print(f"Dataset total count: {len(words)}")

# Save to gemini_hsk5_data.js
js_content = f"const GEMINI_HSK5_DATA = {json.dumps(words, ensure_ascii=False, indent=2)};\n"

with open('gemini_hsk5_data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Written {len(words)} entries to gemini_hsk5_data.js successfully!")
