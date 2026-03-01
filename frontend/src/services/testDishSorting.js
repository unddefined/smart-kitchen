// 菜品排序测试脚本
import { DishService } from './index'

export const testDishSorting = async () => {
  console.log('🔍 测试菜品排序功能...\n')
  
  try {
    // 测试1: 按字母顺序获取菜品
    console.log('📋 测试1: 按字母顺序获取菜品')
    const alphabeticallySorted = await DishService.getAllDishes()
    console.log('前10个菜品（字母顺序）:')
    alphabeticallySorted.slice(0, 10).forEach((dish, index) => {
      console.log(`  ${index + 1}. ${dish.name}`)
    })
    
    console.log('\n' + '='.repeat(50) + '\n')
    
    // 测试2: 按上菜顺序获取菜品
    console.log('📋 测试2: 按上菜顺序获取菜品')
    const servingOrderSorted = await DishService.getAllDishesInServingOrder()
    console.log('前15个菜品（上菜顺序）:')
    servingOrderSorted.slice(0, 15).forEach((dish, index) => {
      console.log(`  ${index + 1}. ${dish.name} (${dish.categoryName})`)
    })
    
    console.log('\n' + '='.repeat(50) + '\n')
    
    // 测试3: 按分类分组获取菜品
    console.log('📋 测试3: 按分类分组获取菜品')
    const groupedDishes = await DishService.getDishesGroupedByCategory()
    console.log('分类分组结果:')
    groupedDishes.forEach((group, groupIndex) => {
      console.log(`\n${groupIndex + 1}. ${group.category.name} (顺序: ${group.category.displayOrder})`)
      group.dishes.slice(0, 3).forEach((dish, dishIndex) => {
        console.log(`   ${dishIndex + 1}. ${dish.name}`)
      })
      if (group.dishes.length > 3) {
        console.log(`   ... 还有 ${group.dishes.length - 3} 个菜品`)
      }
    })
    
    console.log('\n✅ 菜品排序测试完成!')
    
    return {
      success: true,
      alphabeticallyCount: alphabeticallySorted.length,
      servingOrderCount: servingOrderSorted.length,
      groupedCategories: groupedDishes.length
    }
    
  } catch (error) {
    console.error('❌ 菜品排序测试失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 导出测试函数
export default {
  testDishSorting
}