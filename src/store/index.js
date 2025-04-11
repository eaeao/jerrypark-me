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
        const abouts = data.data.portfolios.filter(portfolio => portfolio.category && portfolio.category.title === 'ABOUT');
        const arr = data.data.portfolios.filter(portfolio => portfolio.category && portfolio.category.title !== 'ABOUT');
        abouts.sort((a, b) => {
          return new Date(a.date) > new Date(b.date);
        })
        commit('setPortfolios', [...abouts, ...arr]);
      }
    })
  },
  getPortfolios({commit}, query) {
    commit('setPortfolios', null);
    getPortfolioList({ category: query === 'ALL' ? '' : query }).then(({data}) => {
      if (data.data.portfolios) {
        const abouts = data.data.portfolios.filter(portfolio => portfolio.category && portfolio.category.title === 'ABOUT');
        const arr = data.data.portfolios.filter(portfolio => portfolio.category && portfolio.category.title !== 'ABOUT');
        abouts.sort((a, b) => {
          return new Date(a.date) > new Date(b.date);
        })
        commit('setPortfolios', [...abouts, ...arr]);
      }
    })
  },
  setCategory({commit}, query) {
    commit('setCategory', query);
  },
};
