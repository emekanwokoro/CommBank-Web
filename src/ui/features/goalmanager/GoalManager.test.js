import React from 'react'
import ReactDOM from 'react-dom'
import { act, Simulate } from 'react-dom/test-utils'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { ThemeProvider } from 'styled-components'
import { updateGoal as updateGoalApi } from '../../../api/lib'
import goalsReducer, { updateGoal } from '../../../store/goalsSlice'
import modalReducer from '../../../store/modalSlice'
import themeReducer, { setLightMode } from '../../../store/themeSlice'
import userReducer from '../../../store/userSlice'
import { DarkTheme } from '../../components/Theme'
import GoalCard from '../../pages/Main/goals/GoalCard'
import { GoalManager } from './GoalManager'

jest.mock('../../../api/lib', () => ({ updateGoal: jest.fn().mockResolvedValue(true) }))

const firstGoal = {
  id: '62a3f587102e921da1253d32',
  name: 'House Down Payment',
  icon: null,
  targetAmount: 100000,
  targetDate: new Date('2025-01-08T05:00:00Z'),
  balance: 73501.82,
  created: new Date('2022-06-11T01:53:10.857Z'),
  accountId: 'account-one',
  transactionIds: [],
  tagIds: [],
}

let container
let store
let parentClick

const click = (element) => {
  expect(element).not.toBeNull()
  act(() => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

const addButton = () =>
  Array.from(container.querySelectorAll('button')).find((button) =>
    button.textContent.includes('Add icon'),
  )
const changeButton = () => container.querySelector('[aria-label="Change goal icon"]')

const render = (goal = firstGoal) => {
  act(() => {
    ReactDOM.render(
      <Provider store={store}>
        <ThemeProvider theme={DarkTheme}>
          <div onClick={parentClick}>
            <GoalManager goal={goal} />
            <GoalCard id={goal.id} />
          </div>
        </ThemeProvider>
      </Provider>,
      container,
    )
  })
}

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  parentClick = jest.fn()
  updateGoalApi.mockClear()
  store = configureStore({
    reducer: { goals: goalsReducer, modal: modalReducer, theme: themeReducer, user: userReducer },
    preloadedState: { goals: { map: { [firstGoal.id]: firstGoal }, list: [firstGoal.id] } },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
  })
})

afterEach(() => {
  act(() => {
    ReactDOM.unmountComponentAtNode(container)
  })
  container.remove()
})

test('adds and changes icons through the real picker and updates Redux and the card', () => {
  render()
  expect(addButton()).toBeDefined()
  expect(changeButton()).toBeNull()
  click(addButton())
  expect(container.querySelector('.emoji-mart-dark')).not.toBeNull()
  click(container.querySelector('[aria-label^="😀,"]'))
  expect(store.getState().goals.map[firstGoal.id].icon).toBe('😀')
  expect(container.querySelector('.emoji-mart')).toBeNull()
  expect(addButton()).toBeUndefined()
  expect(changeButton().textContent).toBe('😀')
  expect(
    Array.from(container.querySelectorAll('h1')).filter((node) => node.textContent === '😀'),
  ).toHaveLength(2)

  click(changeButton())
  click(container.querySelector('[aria-label^="😃,"]'))
  expect(store.getState().goals.map[firstGoal.id].icon).toBe('😃')
  expect(changeButton().textContent).toBe('😃')
  expect(parentClick).not.toHaveBeenCalled()
  expect(updateGoalApi).toHaveBeenCalledTimes(2)
  expect(updateGoalApi).toHaveBeenLastCalledWith(
    firstGoal.id,
    expect.objectContaining({ icon: '😃', name: firstGoal.name, balance: firstGoal.balance }),
  )
})

test('preserves the selected icon across later name and amount edits with stale modal props', () => {
  render()
  click(addButton())
  click(container.querySelector('[aria-label^="😀,"]'))
  const nameInput = container.querySelector('input')
  act(() => Simulate.change(nameInput, { target: { value: 'Updated house goal' } }))
  const amountInput = Array.from(container.querySelectorAll('input')).find(
    (input) => input.value === '100000',
  )
  act(() => Simulate.change(amountInput, { target: { value: '120000' } }))
  expect(store.getState().goals.map[firstGoal.id]).toMatchObject({
    icon: '😀',
    name: 'Updated house goal',
    targetAmount: 120000,
    balance: firstGoal.balance,
  })
  expect(updateGoalApi).toHaveBeenLastCalledWith(
    firstGoal.id,
    expect.objectContaining({
      icon: '😀',
      name: 'Updated house goal',
      targetAmount: 120000,
    }),
  )
})

test('follows the Redux picker theme and resets the open picker when switching goals', () => {
  render()
  click(addButton())
  act(() => {
    store.dispatch(setLightMode())
  })
  expect(container.querySelector('.emoji-mart-light')).not.toBeNull()
  const secondGoal = {
    ...firstGoal,
    id: '62a3f5e0102e921da1253d33',
    name: 'Tesla Model Y',
    icon: '🚙',
  }
  act(() => {
    store.dispatch(updateGoal(secondGoal))
  })
  render(secondGoal)
  expect(container.querySelector('.emoji-mart')).toBeNull()
  expect(changeButton().textContent).toBe('🚙')
  expect(addButton()).toBeUndefined()
  expect(container.querySelector('input').value).toBe('Tesla Model Y')
})
