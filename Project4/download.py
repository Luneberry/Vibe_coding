import os
import json
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

def get_trending_videos(api_key, region_code="KR", category_id=None, max_results=50):
    """
    YouTube API를 사용하여 특정 지역의 인기 급상승 동영상을 가져옵니다.
    
    Args:
        api_key (str): YouTube Data API v3 키
        region_code (str): 국가 코드 (기본값: 'KR' for Korea)
        category_id (str, optional): 비디오 카테고리 ID
        max_results (int): 가져올 최대 결과 수 (최대 50)
    
    Returns:
        list: 인기 급상승 동영상 목록
    """
    try:
        # YouTube API 클라이언트 생성
        youtube = build('youtube', 'v3', developerKey=api_key)
        
        # videos.list 요청 파라미터 설정
        request_params = {
            'part': 'snippet,contentDetails,statistics',
            'chart': 'mostPopular',
            'regionCode': region_code,
            'maxResults': max_results
        }
        
        # 카테고리 ID가 제공된 경우 파라미터에 추가
        if category_id:
            request_params['videoCategoryId'] = category_id
            
        # API 요청 실행
        request = youtube.videos().list(**request_params)
        response = request.execute()
        
        return response.get('items', [])
    
    except HttpError as e:
        print(f'YouTube API 오류 발생: {e}')
        return []

def save_to_json(data, filename='trending_videos.json'):
    """
    데이터를 JSON 파일로 저장합니다.
    
    Args:
        data (list or dict): 저장할 데이터
        filename (str): 저장할 파일 이름
    """
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f'데이터가 {filename}에 성공적으로 저장되었습니다.')

def main():
    # YouTube API 키 설정
    # 주의: 실제 사용 시에는 환경 변수나 별도의 설정 파일에서 불러오는 것을 권장합니다.
    api_key = "AIzaSyAnO_HfsAd-4lG7zGc2EVbh7z8s9e-Z11I"
    
    # 환경 변수에서 API 키를 불러오는 방법
    # api_key = os.environ.get('YOUTUBE_API_KEY')
    
    if not api_key or api_key == "YOUR_API_KEY_HERE":
        print("API 키를 설정해주세요.")
        return
    
    # 인기 급상승 동영상 가져오기
    trending_videos = get_trending_videos(api_key, max_results=50)
    
    if not trending_videos:
        print("인기 급상승 동영상을 가져오지 못했습니다.")
        return
    
    # 필요한 정보만 추출
    video_data = []
    for video in trending_videos:
        video_info = {
            'id': video['id'],
            'title': video['snippet']['title'],
            'channelTitle': video['snippet']['channelTitle'],
            'publishedAt': video['snippet']['publishedAt'],
            'thumbnail': video['snippet']['thumbnails']['high']['url'],
            'viewCount': video['statistics'].get('viewCount', '0'),
            'likeCount': video['statistics'].get('likeCount', '0'),
            'commentCount': video['statistics'].get('commentCount', '0'),
            'duration': video['contentDetails']['duration']
        }
        video_data.append(video_info)
    
    # JSON 파일로 저장
    save_to_json(video_data)

if __name__ == "__main__":
    main() 