<template>
  <div class="order-entry-form">
    <a-form
      :model="formState"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      @finish="onFinish"
    >
      <!-- 基本信息 -->
      <a-form-item
        label="台号"
        name="hallNumber"
        :rules="[{ required: true, message: '请输入台号' }]"
      >
        <a-input v-model:value="formState.hallNumber" placeholder="如：A01" />
      </a-form-item>

      <a-form-item
        label="人数"
        name="peopleCount"
        :rules="[{ required: true, message: '请输入用餐人数' }]"
      >
        <a-input-number
          v-model:value="formState.peopleCount"
          :min="1"
          :max="20"
        />
      </a-form-item>

      <a-form-item label="桌数" name="tableCount">
        <a-input-number
          v-model:value="formState.tableCount"
          :min="1"
          :max="5"
        />
      </a-form-item>

      <a-form-item label="用餐时间" name="mealTime">
        <a-select v-model:value="formState.mealTime">
          <a-select-option value="午餐">午餐</a-select-option>
          <a-select-option value="晚餐">晚餐</a-select-option>
        </a-select>
      </a-form-item>

      <!-- 菜品选择 -->
      <a-form-item label="菜品选择">
        <div class="dish-selection">
          <div class="dish-search">
            <a-input-search
              v-model:value="searchKeyword"
              placeholder="搜索菜品..."
              @search="searchDishes"
              style="margin-bottom: 10px"
            />
            <a-button type="link" @click="showAddDishModal"
              >+ 新增菜品</a-button
            >
          </div>

          <div class="dish-categories">
            <a-tabs
              v-model:activeKey="activeCategory"
              @change="onCategoryChange"
            >
              <a-tab-pane
                v-for="category in dishCategories"
                :key="category.id"
                :tab="category.name"
              >
                <div class="dish-grid">
                  <div
                    v-for="dish in filteredDishes(category.id)"
                    :key="dish.id"
                    class="dish-item"
                    :class="{ selected: isSelected(dish.id) }"
                    @click="toggleDishSelection(dish)"
                  >
                    <div class="dish-name">{{ dish.name }}</div>
                    <div class="dish-info">
                      <span class="station">{{ dish.stationName }}</span>
                      <span v-if="dish.countable" class="countable"
                        >(计数)</span
                      >
                    </div>
                  </div>
                </div>
              </a-tab-pane>
            </a-tabs>
          </div>

          <!-- 已选菜品列表 -->
          <div class="selected-dishes">
            <h4>已选菜品 ({{ selectedDishes.length }})</h4>
            <div class="selected-list">
              <div
                v-for="(selected, index) in selectedDishes"
                :key="selected.dishId"
                class="selected-item"
              >
                <div class="item-main">
                  <span class="dish-name">{{ selected.dishName }}</span>
                  <a-input-number
                    v-model:value="selected.quantity"
                    :min="1"
                    :max="20"
                    size="small"
                    style="width: 70px; margin: 0 10px"
                  />
                  <span>份</span>
                </div>
                <div class="item-actions">
                  <a-input
                    v-model:value="selected.remark"
                    placeholder="备注"
                    size="small"
                    style="width: 120px; margin-right: 10px"
                  />
                  <a-select
                    v-model:value="selected.weight"
                    placeholder="份量"
                    size="small"
                    style="width: 80px; margin-right: 10px"
                  >
                    <a-select-option value="小份">小份</a-select-option>
                    <a-select-option value="中份">中份</a-select-option>
                    <a-select-option value="大份">大份</a-select-option>
                  </a-select>
                  <a-button
                    type="text"
                    danger
                    size="small"
                    @click="removeSelectedDish(index)"
                  >
                    删除
                  </a-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </a-form-item>

      <a-form-item :wrapper-col="{ offset: 6, span: 18 }">
        <a-button type="primary" html-type="submit">提交订单</a-button>
        <a-button style="margin-left: 10px" @click="resetForm">重置</a-button>
      </a-form-item>
    </a-form>

    <!-- 新增菜品牌态框 -->
    <a-modal
      v-model:visible="addDishVisible"
      title="新增菜品"
      @ok="handleAddDish"
      @cancel="addDishVisible = false"
    >
      <a-form
        :model="newDishForm"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-item
          label="菜品名称"
          name="name"
          :rules="[{ required: true, message: '请输入菜品名称' }]"
        >
          <a-input
            v-model:value="newDishForm.name"
            placeholder="请输入菜品名称"
          />
        </a-form-item>

        <a-form-item
          label="所属分类"
          name="categoryId"
          :rules="[{ required: true, message: '请选择分类' }]"
        >
          <a-select
            v-model:value="newDishForm.categoryId"
            placeholder="请选择分类"
          >
            <a-select-option
              v-for="category in dishCategories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item
          label="所属工位"
          name="stationId"
          :rules="[{ required: true, message: '请选择工位' }]"
        >
          <a-select
            v-model:value="newDishForm.stationId"
            placeholder="请选择工位"
          >
            <a-select-option
              v-for="station in stations"
              :key="station.id"
              :value="station.id"
            >
              {{ station.name }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="是否计数">
          <a-switch v-model:checked="newDishForm.countable" />
          <span class="help-text">开启后按用餐人数计算份量</span>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from "vue";
import { message } from "ant-design-vue";

export default {
  name: "OrderEntryForm",
  emits: ["submit"],
  setup(props, { emit }) {
    // 表单状态
    const formState = reactive({
      hallNumber: "",
      peopleCount: 1,
      tableCount: 1,
      mealTime: "午餐",
      items: [],
    });

    // 搜索关键词
    const searchKeyword = ref("");
    const activeCategory = ref(1);

    // 新增菜品表单
    const addDishVisible = ref(false);
    const newDishForm = reactive({
      name: "",
      categoryId: undefined,
      stationId: undefined,
      countable: false,
    });

    // 数据
    const dishCategories = ref([
      { id: 1, name: "前菜" },
      { id: 2, name: "中菜" },
      { id: 3, name: "后菜" },
      { id: 4, name: "尾菜" },
      { id: 5, name: "凉菜" },
      { id: 6, name: "点心" },
      { id: 7, name: "蒸菜" },
    ]);

    const stations = ref([
      { id: 1, name: "热菜" },
      { id: 2, name: "打荷" },
      { id: 3, name: "凉菜" },
      { id: 4, name: "蒸煮" },
      { id: 5, name: "点心" },
      { id: 6, name: "切配" },
    ]);

    const allDishes = ref([
      // 前菜
      {
        id: 1,
        name: "椒盐基围虾",
        categoryId: 1,
        stationId: 1,
        stationName: "热菜",
        countable: false,
      },
      {
        id: 2,
        name: "藜麦元宝虾",
        categoryId: 1,
        stationId: 1,
        stationName: "热菜",
        countable: false,
      },
      {
        id: 3,
        name: "盐水河虾",
        categoryId: 1,
        stationId: 1,
        stationName: "热菜",
        countable: false,
      },

      // 中菜
      {
        id: 4,
        name: "红烧肉",
        categoryId: 2,
        stationId: 1,
        stationName: "热菜",
        countable: false,
      },
      {
        id: 5,
        name: "宫保鸡丁",
        categoryId: 2,
        stationId: 1,
        stationName: "热菜",
        countable: false,
      },
      {
        id: 6,
        name: "托炉饼",
        categoryId: 2,
        stationId: 5,
        stationName: "点心",
        countable: true,
      },
      {
        id: 7,
        name: "椒盐排骨",
        categoryId: 2,
        stationId: 1,
        stationName: "热菜",
        countable: true,
      },

      // 后菜
      {
        id: 8,
        name: "菠萝炒饭",
        categoryId: 3,
        stationId: 1,
        stationName: "热菜",
        countable: false,
      },
      {
        id: 9,
        name: "荷塘月色",
        categoryId: 3,
        stationId: 1,
        stationName: "热菜",
        countable: false,
      },

      // 尾菜
      {
        id: 10,
        name: "时蔬",
        categoryId: 4,
        stationId: 1,
        stationName: "热菜",
        countable: false,
      },
      {
        id: 11,
        name: "蛋皮汤",
        categoryId: 4,
        stationId: 1,
        stationName: "热菜",
        countable: false,
      },
    ]);

    const selectedDishes = ref([]);

    // 计算属性
    const filteredDishes = computed(() => (categoryId) => {
      let dishes = allDishes.value.filter(
        (dish) => dish.categoryId === categoryId,
      );

      if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase();
        dishes = dishes.filter((dish) =>
          dish.name.toLowerCase().includes(keyword),
        );
      }

      return dishes;
    });

    // 方法
    const searchDishes = (value) => {
      searchKeyword.value = value;
    };

    const onCategoryChange = (key) => {
      activeCategory.value = key;
    };

    const isSelected = (dishId) => {
      return selectedDishes.value.some((item) => item.dishId === dishId);
    };

    const toggleDishSelection = (dish) => {
      const index = selectedDishes.value.findIndex(
        (item) => item.dishId === dish.id,
      );

      if (index > -1) {
        // 已选择，移除
        selectedDishes.value.splice(index, 1);
      } else {
        // 未选择，添加
        selectedDishes.value.push({
          dishId: dish.id,
          dishName: dish.name,
          quantity: 1,
          weight: undefined,
          remark: "",
        });
      }
    };

    const removeSelectedDish = (index) => {
      selectedDishes.value.splice(index, 1);
    };

    const showAddDishModal = () => {
      addDishVisible.value = true;
      // 重置表单
      Object.assign(newDishForm, {
        name: "",
        categoryId: undefined,
        stationId: undefined,
        countable: false,
      });
    };

    const handleAddDish = async () => {
      try {
        // 验证表单
        if (
          !newDishForm.name ||
          !newDishForm.categoryId ||
          !newDishForm.stationId
        ) {
          message.error("请填写完整信息");
          return;
        }

        // 模拟API调用
        const newDish = {
          id: Date.now(), // 临时ID
          name: newDishForm.name,
          categoryId: newDishForm.categoryId,
          stationId: newDishForm.stationId,
          stationName:
            stations.value.find((s) => s.id === newDishForm.stationId)?.name ||
            "",
          countable: newDishForm.countable,
        };

        // 添加到菜品列表
        allDishes.value.push(newDish);

        message.success("菜品添加成功");
        addDishVisible.value = false;
      } catch (error) {
        message.error("添加菜品失败: " + error.message);
      }
    };

    const onFinish = async (values) => {
      try {
        if (selectedDishes.value.length === 0) {
          message.error("请至少选择一个菜品");
          return;
        }

        // 构造订单数据
        const orderData = {
          ...formState,
          items: selectedDishes.value.map((item) => ({
            dishId: item.dishId,
            quantity: item.quantity,
            weight: item.weight,
            remark: item.remark,
          })),
        };

        // 发送提交事件
        emit("submit", orderData);

        message.success("订单提交成功");
        resetForm();
      } catch (error) {
        message.error("提交订单失败: " + error.message);
      }
    };

    const resetForm = () => {
      Object.assign(formState, {
        hallNumber: "",
        peopleCount: 1,
        tableCount: 1,
        mealTime: "午餐",
      });

      selectedDishes.value = [];
      searchKeyword.value = "";
      activeCategory.value = 1;
    };

    // 生命周期
    onMounted(() => {
      // 可以在这里加载初始数据
    });

    return {
      formState,
      searchKeyword,
      activeCategory,
      addDishVisible,
      newDishForm,
      dishCategories,
      stations,
      allDishes,
      selectedDishes,
      filteredDishes,
      searchDishes,
      onCategoryChange,
      isSelected,
      toggleDishSelection,
      removeSelectedDish,
      showAddDishModal,
      handleAddDish,
      onFinish,
      resetForm,
    };
  },
};
</script>

<style scoped>
.order-entry-form {
  padding: 20px;
}

.dish-selection {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 15px;
}

.dish-search {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.dish-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.dish-item {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.dish-item:hover {
  border-color: #1890ff;
  background: #f0faff;
}

.dish-item.selected {
  border-color: #1890ff;
  background: #e6f7ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.dish-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.dish-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.countable {
  color: #ff4d4f;
  font-weight: bold;
}

.selected-dishes {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.selected-dishes h4 {
  margin-bottom: 15px;
  color: #333;
}

.selected-list {
  max-height: 300px;
  overflow-y: auto;
}

.selected-item {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-bottom: 10px;
  background: #fafafa;
}

.item-main {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.dish-name {
  font-weight: bold;
  margin-right: 10px;
}

.item-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.help-text {
  margin-left: 10px;
  color: #999;
  font-size: 12px;
}

@media (max-width: 768px) {
  .dish-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .item-main {
    flex-direction: column;
    align-items: flex-start;
  }

  .item-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
