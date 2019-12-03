import {getCategories, getPortfolioList} from '~/store/api'

export const state = () => ({
  categories: null,
  portfolios: null,
  category: 'ALL'
});

export const mutations = {
  setCategories: (state, _categories) => {
    state.categories = _categories
  },
  setPortfolios: (state, _portfolios) => {
    state.portfolios = _portfolios
  },
  setCategory: (state, _category) => {
    state.category = _category
  }
};

export const actions = {
  async nuxtServerInit({commit}, {req}) {
    await getCategories().then(({data}) => {
      if (data.data.categories) {
        commit('setCategories', data.data.categories);
      }
    })
    await getPortfolioList({ category: req.originalUrl.replace(/\//gi, '').toUpperCase() }).then(({data}) => {
      if (data.data.portfolios) {
        commit('setPortfolios', req.originalUrl === '/'
          ? [data.data.portfolios[data.data.portfolios.length - 1], ...data.data.portfolios.slice(0, data.data.portfolios.length - 1)]
          : data.data.portfolios
        );
      }
    })
  },
  getPortfolios({commit}, query) {
    commit('setPortfolios', null);
    getPortfolioList({ category: query === 'ALL' ? '' : query }).then(({data}) => {
      if (data.data.portfolios) {
        commit('setPortfolios', query === 'ALL'
          ? [data.data.portfolios[data.data.portfolios.length - 1], ...data.data.portfolios.slice(0, data.data.portfolios.length - 1)]
          : data.data.portfolios
        );
      }
    })
  },
  setCategory({commit}, query) {
    commit('setCategory', query);
  },
};
