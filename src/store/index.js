import {getCategories, getPortfolioList} from '~/store/api'

const normalizePortfolios = (rawPortfolios = []) => {
  if (!Array.isArray(rawPortfolios)) {
    return []
  }

  const abouts = rawPortfolios.filter(portfolio => portfolio.category && portfolio.category.title === 'ABOUT');
  const others = rawPortfolios.filter(portfolio => portfolio.category && portfolio.category.title !== 'ABOUT');

  abouts.sort((a, b) => {
    return new Date(a.date) > new Date(b.date);
  });

  return [...abouts, ...others];
};

const safeCategoryFromReq = (req) => {
  if (!req || !req.originalUrl) {
    return 'ALL';
  }

  const cleaned = req.originalUrl.split('?')[0].replace(/\//gi, '').toUpperCase();
  return cleaned || 'ALL';
};

const logStoreError = (label, error) => {
  if (process.server) {
    // 서버 렌더링 시 콘솔에 표시
    console.error(`[store:${label}]`, error);
  } else if (process.client) {
    // 클라이언트에서도 동일하게 표시
    console.error(`[store:${label}]`, error);
  }
};

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
    try {
      const {data} = await getCategories();
      if (data && data.data && data.data.categories) {
        commit('setCategories', data.data.categories);
      } else {
        commit('setCategories', []);
      }
    } catch (error) {
      commit('setCategories', []);
      logStoreError('nuxtServerInit:getCategories', error);
    }

    const requestCategory = safeCategoryFromReq(req);
    try {
      const {data} = await getPortfolioList({ category: requestCategory === 'ALL' ? '' : requestCategory });
      if (data && data.data && data.data.portfolios) {
        commit('setPortfolios', normalizePortfolios(data.data.portfolios));
      } else {
        commit('setPortfolios', []);
      }
    } catch (error) {
      commit('setPortfolios', []);
      logStoreError('nuxtServerInit:getPortfolioList', error);
    }
  },
  async getPortfolios({commit}, query) {
    commit('setPortfolios', null);
    try {
      const {data} = await getPortfolioList({ category: query === 'ALL' ? '' : query });
      if (data && data.data && data.data.portfolios) {
        commit('setPortfolios', normalizePortfolios(data.data.portfolios));
        return;
      }
      commit('setPortfolios', []);
    } catch (error) {
      commit('setPortfolios', []);
      logStoreError('getPortfolios', error);
    }
  },
  setCategory({commit}, query) {
    commit('setCategory', query);
  },
};
