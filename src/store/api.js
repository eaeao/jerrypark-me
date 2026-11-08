import Vue from 'vue'
import axios from 'axios'

const axiosInstance = function () {
  
  return axios.create({
    baseURL: "https://jerrypark.me/api/",
    timeout: 50000
  })
}

export function getCategories () {
  return new Promise((resolve, reject) => {
    return axiosInstance().post('',{
      query: `{ categories { title index } }`
    })
      .then(response => resolve(response))
      .catch(err => reject(err))
  })
}

// 카테고리·제목은 쿼리 문자열에 끼워 넣지 않고 GraphQL 변수로 넘긴다.
// (문자열에 넣으면 " 나 \ 가 든 값이 쿼리를 깨뜨려 API가 400을 돌려준다.)
export function getPortfolioList ({ category }) {
  return new Promise((resolve, reject) => {
    return axiosInstance().post('',{
      query: `query ($category: String) {
  portfolios(category: $category) {
    title date cover isMain category { title }
  }
}`,
      variables: { category }
    })
      .then(response => resolve(response))
      .catch(err => reject(err))
  })
}

export function getPortfolio ({ title }) {
  return new Promise((resolve, reject) => {
    return axiosInstance().post('',{
      query: `query ($title: String) {
  portfolio(title: $title) {
    title con safe date category { title }
    PortfolioImages {
      src isHidden
    }
  }
}`,
      variables: { title }
    })
      .then(response => resolve(response))
      .catch(err => reject(err))
  })
}

export function getPortfolios () {
  return new Promise((resolve, reject) => {
    return axiosInstance().post('',{
      query: `{
  portfolios(category: "") {
    title con safe date category { title }
    PortfolioImages {
      src isHidden
    }
  }
}`
    })
      .then(response => resolve(response))
      .catch(err => reject(err))
  })
}
