## 브이에이트코프 기술 과제 \_ 이은석

#### [인스턴스](http://ec2-3-36-78-152.ap-northeast-2.compute.amazonaws.com/)

---

### 기술 스택

##### 언어 및 프레임워크

<p>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white"/>
</p>

##### 데이터베이스 및 ORM

<p>
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white"/>
  <img src="https://img.shields.io/badge/TypeORM-262627?style=flat-square&logo=typeorm&logoColor=white"/>
</p>

##### 테스트 및 CI/CD

<p>
  <img src="https://img.shields.io/badge/Jest-C21325?style=flat-square&logo=jest&logoColor=white"/>
  <img src="https://img.shields.io/badge/GitHub%20Actions-2088FF?style=flat-square&logo=github-actions&logoColor=white"/>
</p>

##### 클라우드 및 컨테이너

<p>
  <img src="https://img.shields.io/badge/AWS%20EC2-FF9900?style=flat-square&logo=amazon-ec2&logoColor=white"/>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white"/>
</p>

---

## 구현과정

1. [ERD](https://dbdiagram.io/d/6666bc849713410b052e0b01) 설계

   - user, post, comment, publicFile, category 테이블 및 관계형 데이터 모델 설계
     ![v8board erd](https://github.com/enxxi/jobDoor/assets/101889199/511ac609-efce-47f4-bb8d-34694c6d8fab)

2. 프로젝트 관리 [노션](https://enxxi.notion.site/59d0c37d96e04395a2590fca33801474)

---

## 기능 설명

#### 1. 회원가입 및 로그인

 <ul>
  <li>JWT를 사용한 인증</li>
  <li>리프레시 토큰 사용 및 토큰 만료 시 재발급
</li>
  <li>유저 역할: 일반 유저 / 관리자</li>
</ul>

#### 2. 게시글 관리

 <ul>
<li>글 카테고리: 공지사항, Q&A, 1:1문의</li>
  - 공지사항은 관리자만 생성, 수정, 삭제 가능
<li>글 작성 시 이미지 업로드 가능 (AWS S3 사용)
</li>
<li>글 정렬: 최신순, 인기순(조회순)</li>
   - 인기순: 전체 기간, 1년, 1달, 1주 기준
<li>검색 기능:</li>
   - 제목 + 작성자 / 제목 / 작성자

</ul>

#### 3. 테스트 코드

  <ul>
  <li>Jest를 사용한 유닛 테스트 작성</li>
</ul>

#### 4. 배포

 <ul>
  <li>main 브랜치에 push → 테스트 실행 → EC2 인스턴스로 자동 배포 (GitHub Actions, Docker)</li>
</ul>
