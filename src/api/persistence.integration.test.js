import React from 'react'
import ReactDOM from 'react-dom'
import { act } from 'react-dom/test-utils'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { ThemeProvider } from 'styled-components'
import { getGoals } from './lib'
import goalsReducer from '../store/goalsSlice'
import modalReducer from '../store/modalSlice'
import themeReducer from '../store/themeSlice'
import userReducer from '../store/userSlice'
import { DarkTheme } from '../ui/components/Theme'
import { GoalManager } from '../ui/features/goalmanager/GoalManager'

const integrationTest = process.env.FORAGE_API_INTEGRATION === '1' ? test : test.skip

integrationTest('emoji selection persists in MongoDB and survives a fresh client store', async () => {
  const goals = await getGoals()
  expect(goals).not.toBeNull()
  const original = goals.find((goal) => goal.id === '62a3f587102e921da1253d32')
  expect(original.icon).toBeNull()
  const container = document.createElement('div')
  document.body.appendChild(container)

  const render = (goal) => {
    const store = configureStore({
      reducer: { goals: goalsReducer, modal: modalReducer, theme: themeReducer, user: userReducer },
      preloadedState: { goals: { map: { [goal.id]: goal }, list: [goal.id] } },
    })
    act(() => {
      ReactDOM.render(
        <Provider store={store}>
          <ThemeProvider theme={DarkTheme}>
            <GoalManager goal={goal} />
          </ThemeProvider>
        </Provider>,
        container,
      )
    })
    return store
  }

  try {
    const store = render(original)
    const addIcon = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent.includes('Add icon'),
    )
    act(() => {
      addIcon.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    const emoji = container.querySelector('[aria-label^="😀,"]')
    expect(emoji).not.toBeNull()
    act(() => {
      emoji.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(store.getState().goals.map[original.id].icon).toBe('😀')

    let persisted
    for (let attempt = 0; attempt < 40; attempt++) {
      persisted = (await getGoals()).find((goal) => goal.id === original.id)
      if (persisted.icon === '😀') break
      await new Promise((resolve) => setTimeout(resolve, 25))
    }
    expect(persisted).toEqual({ ...original, icon: '😀' })
    act(() => {
      ReactDOM.unmountComponentAtNode(container)
    })

    // A new HTTP read and Redux store model a full client refresh.
    const reloaded = (await getGoals()).find((goal) => goal.id === original.id)
    const freshStore = render(reloaded)
    expect(freshStore).not.toBe(store)
    expect(container.querySelector('[aria-label="Change goal icon"]').textContent).toBe('😀')
  } finally {
    act(() => {
      ReactDOM.unmountComponentAtNode(container)
    })
    container.remove()
  }
}, 15000)
