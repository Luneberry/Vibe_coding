import requests
import json

# KRW-BTC 마켓에 2025년 3월 24일(UTC) 이전 일봉 100개를 요청
url = "https://api.upbit.com/v1/candles/days"
params = {  
    'market': 'KRW-BTC',  
    'count': 100,
    'to': '2025-09-24 00:00:00'
}  
headers = {"accept": "application/json"}

response = requests.get(url, params=params, headers=headers)

# 응답 확인
if response.status_code == 200:
    data = response.json()
    
    # 파일명 생성
    market = params['market']
    count = params['count']
    to_date = params['to'].split(' ')[0]  # '2025-03-24 00:00:00'에서 '2025-03-24'만 추출
    filename = f"{market}_{to_date}_{count}.json"
    
    # JSON 파일로 저장
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    
    print(f"데이터가 {filename} 파일로 저장되었습니다.")
else:
    print(f"API 요청 실패: {response.status_code}")
    print(response.text)