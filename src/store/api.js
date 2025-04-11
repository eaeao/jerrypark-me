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

export function getPortfolioList ({ category }) {
  return new Promise((resolve, reject) => {
    return axiosInstance().post('',{
      query: `{
  portfolios(category: "${category}") {
    title date cover isMain category { title }
  }
}`
    })
      .then(response => resolve(response))
      .catch(err => reject(err))
  })
}

export function getPortfolio ({ title }) {
  return new Promise((resolve, reject) => {
    return axiosInstance().post('',{
      query: `{
  portfolio(title: "${title}") {
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