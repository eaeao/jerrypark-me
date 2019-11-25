import Vue from 'vue'
import axios from 'axios'

export const state = () => ({
  categories: null,
  portfolios: null,
  category: 'ALL'
});

export const mutations = {
  getCategories: function (state, _categories) {
    state.categories = _categories
  },
  setPortfolios: function (state, _portfolios) {
    state.portfolios = _portfolios
  },
  setCategory: function (state, _category) {
    state.category = _category
  }
};

export const actions = {
  async nuxtServerInit({commit}, {req}) {
    let res = await axios.post(Vue.prototype.$apiUrl, {query: `{ categories { title index } }`});
    if (res.data.data.categories) {
      commit('getCategories', res.data.data.categories);
    }
    res = await axios.post(Vue.prototype.$apiUrl, {
      query: `{
  portfolios(category: "${req.originalUrl.replace(/\//gi, '').toUpperCase()}") {
    title date cover isMain category { title }
  }
}`
    });
    if (res.data.data.portfolios) {
      commit('setPortfolios', req.originalUrl === '/'
        ? [res.data.data.portfolios[res.data.data.portfolios.length - 1], ...res.data.data.portfolios.slice(0, res.data.data.portfolios.length - 1)]
        : res.data.data.portfolios);
    }
  },
  async getPortfolios({commit}, query) {
    commit('setPortfolios', null);
    let {data} = await axios.post(Vue.prototype.$apiUrl, {
      query: `{
  portfolios(category: "${query === 'ALL' ? '' : query}") {
    title date cover isMain category { title }
  }
}`
    });
    if (data.data.portfolios) {
      commit('setPortfolios', query === 'ALL'
        ? [data.data.portfolios[data.data.portfolios.length - 1], ...data.data.portfolios.slice(0, data.data.portfolios.length - 1)]
        : data.data.portfolios);
    }
  },
  setCategory({commit}, query) {
    commit('setCategory', query);
  },
};
