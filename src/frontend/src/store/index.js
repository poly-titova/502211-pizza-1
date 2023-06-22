import Vue from "vue";
import Vuex from "vuex";

import { doughSpellingMap } from "@/common/constants";

import VuexPlugins from "@/plugins/vuexPlugins";

// импорт модулей
import modules from "@/store/modules";

// импорт типов мутаций
import { RESET_STORE, FETCH_ENTITY } from "@/store/mutation-types";

import { defaultState as resetAuthState } from "@/store/modules/auth.store";
import { defaultState as resetBuilderState } from "@/store/modules/builder.store";
import { defaultState as resetCartState } from "@/store/modules/cart.store";
import { defaultState as resetOrdersState } from "@/store/modules/orders.store";

Vue.use(Vuex);

const resetState = () => ({
  Auth: resetAuthState(),
  Builder: resetBuilderState(),
  Cart: resetCartState(),
  Orders: resetOrdersState(),
});

const state = {
  dough: [],
  sizes: [],
  sauces: [],
  ingredients: [],
  misc: [],
};

const getters = {
  getEntityById: (state) => (entity, id) => {
    return state[entity].find((it) => it.id === id);
  },

  totalPizzaPrice: () => (sizeId, doughId, sauceId, ingredients, getter) => {
    const multiplier = getter("sizes", sizeId)?.multiplier;
    const doughPrice = getter("dough", doughId)?.price;
    const saucePrice = getter("sauces", sauceId)?.price;
    const ingredientsPrice = ingredients.reduce((prev, curr) => {
      const ingredientPrice = getter("ingredients", curr.ingredientId)?.price;

      return prev + ingredientPrice * curr.quantity;
    }, 0);

    return multiplier * (doughPrice + saucePrice + ingredientsPrice);
  },

  getCountSum: () => (items, itemList) => {
    return (
      items?.reduce(
        (prev, curr) =>
          prev +
          curr.quantity * itemList.find((it) => it.id === curr.miscId).price,
        0
      ) || 0
    );
  },

  getDoughText: () => (sizeId, doughId, getter) => {
    const size = getter("sizes", sizeId).name;
    const dough = getter("dough", doughId).name;

    return `${size}, на ${doughSpellingMap[dough]} тесте`;
  },

  getIngredientsText: () => (ingredients, ingredientsList) => {
    return `Начинка: ${ingredients
      .map((ingredient) => {
        return ingredientsList
          .find((ingredientListItem) => {
            return ingredientListItem.id === ingredient.ingredientId;
          })
          .name.toLowerCase();
      })
      .join(", ")}`;
  },

  getSauceText: () => (sauceId, getter) => {
    const sauce = getter("sauces", sauceId).name;

    return `Соус: ${sauce.toLowerCase()}`;
  },

  formInputClassSize: () => (additionalSizeClass, size) => {
    return size.length !== 0 ? `${additionalSizeClass}--${size}` : "";
  },

  imageWithExtensionLink: () => (link, extension) => {
    const linkWithoutExtension = link.split(".")[0];

    return `${linkWithoutExtension}${extension}`;
  },

  itemsCounter: () => (items, id, propertyName) => {
    const itemIndex = items.findIndex((it) => it[propertyName] === id);

    return itemIndex === -1 ? 0 : items[itemIndex].quantity;
  },
};

const actions = {
  // инициализация первичных данных приложения
  async init({ dispatch, rootState }) {
    dispatch("fetchDough");
    dispatch("fetchSizes");
    dispatch("fetchSauces");
    dispatch("fetchIngredients");
    dispatch("fetchMisc");

    if (rootState["Auth"].isAuthenticated) {
      dispatch("Orders/fetchUserAddresses");
      dispatch("Orders/fetchUserOrders");
    }
  },

  // получение списка видов теста
  async fetchDough({ commit }) {
    const dough = await this.$api.dough.query();

    commit(FETCH_ENTITY, { entity: dough, name: "dough" });
    commit("Builder/UPDATE_DOUGH_VALUE", dough[0].id);
  },

  // получение списка размеров теста
  async fetchSizes({ commit }) {
    const sizes = await this.$api.sizes.query();

    commit(FETCH_ENTITY, { entity: sizes, name: "sizes" });
    commit("Builder/UPDATE_SIZE_VALUE", sizes[0].id);
  },

  // получение списка соусов для теста
  async fetchSauces({ commit }) {
    const sauces = await this.$api.sauces.query();

    commit(FETCH_ENTITY, { entity: sauces, name: "sauces" });
    commit("Builder/UPDATE_SAUCE_VALUE", sauces[0].id);
  },

  // получение списка ингредиентов
  async fetchIngredients({ commit }) {
    const ingredients = await this.$api.ingredients.query();

    commit(FETCH_ENTITY, { entity: ingredients, name: "ingredients" });
  },

  // получение списка доп. продуктов
  async fetchMisc({ commit }) {
    const misc = await this.$api.misc.query();

    commit(FETCH_ENTITY, { entity: misc, name: "misc" });
  },
};

const mutations = {
  [RESET_STORE](state) {
    Object.assign(state, resetState(state));
  },

  [FETCH_ENTITY](state, { entity, name }) {
    state[name] = entity;
  },
};

export default new Vuex.Store({
  state,
  getters,
  actions,
  modules,
  mutations,
  plugins: [VuexPlugins],
});
