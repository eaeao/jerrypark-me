import {getCategories, getPortfolioList} from '~/store/api'
import {resolveCategoryTitle} from '~/utils/site'

const normalizePortfolios = (rawPortfolios = []) => {
  if (!Array.isArray(rawPortfolios)) {
    return []
  }

  const abouts = rawPortfolios.filter(portfolio => portfolio.category && portfolio.category.title === 'ABOUT');
  const others = rawPortfolios.filter(portfolio => portfolio.category && portfolio.category.title !== 'ABOUT');

  abouts.sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });

  return [...abouts, ...others];
};

// SSR에서 카드 목록이 필요한 라우트의 카테고리. 목록이 필요 없는 라우트(글 상세, 인쇄, /article)는 null.
const listCategoryFromRoute = (route, categories) => {
  if (!route) {
    return null
  }
  if (route.name === 'index') {
    return 'ALL'
  }
  if (route.name === 'category' && route.params) {
    // 없는 카테고리면 null → 목록을 불러오지 않는다(페이지의 validate()가 404를 낸다).
    return resolveCategoryTitle(categories, route.params.category)
  }
  return null
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
  async nuxtServerInit({commit, state}, {route}) {
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

    const requestCategory = listCategoryFromRoute(route, state.categories);
    if (!requestCategory) {
      // 글 상세·인쇄·404 페이지에서는 목록 API를 부르지 않는다.
      // 빈 배열로 두면 홈(/)에 들어갈 때 pages/index.vue가 목록을 다시 불러온다.
      commit('setPortfolios', []);
      return;
    }

    try {
      const {data} = await getPortfolioList({ category: requestCategory === 'ALL' ? '' : requestCategory });
      if (data && data.data && data.data.portfolios) {
        commit('setPortfolios', normalizePortfolios(data.data.portfolios));
        // 헤더의 활성 메뉴가 서버 렌더링 때부터 맞고, 마운트 후 같은 목록을 다시 부르지 않도록 카테고리를 맞춘다.
        // 목록을 못 불러왔을 때는 'ALL'로 남겨 두어, 마운트 후 카테고리 watcher가 목록을 다시 불러오게 한다.
        commit('setCategory', requestCategory);
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
