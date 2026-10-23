import { faCalendarAlt } from '@fortawesome/free-regular-svg-icons'
import { faDollarSign, IconDefinition } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { MaterialUiPickersDate } from '@material-ui/pickers/typings/date'
import 'date-fns'
import { BaseEmoji } from 'emoji-mart'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { updateGoal as updateGoalApi } from '../../../api/lib'
import { Goal } from '../../../api/types'
import { selectGoalsMap, updateGoal as updateGoalRedux } from '../../../store/goalsSlice'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import DatePicker from '../../components/DatePicker'
import EmojiPicker from '../../components/EmojiPicker'
import { Theme } from '../../components/Theme'
import AddIconButton from './AddIconButton'
import GoalIcon from './GoalIcon'

type Props = { goal: Goal }
export function GoalManager(props: Props) {
  const dispatch = useAppDispatch()

  const goal = useAppSelector(selectGoalsMap)[props.goal.id] ?? props.goal

  const [name, setName] = useState<string | null>(goal.name)
  const [targetDate, setTargetDate] = useState<Date | null>(goal.targetDate)
  const [targetAmount, setTargetAmount] = useState<number | null>(goal.targetAmount)
  const [icon, setIcon] = useState<string | null>(goal.icon ?? null)
  const [emojiPickerIsOpen, setEmojiPickerIsOpen] = useState(false)
  const hasIcon = icon != null && icon !== ''

  useEffect(() => {
    setName(goal.name)
    setTargetDate(goal.targetDate)
    setTargetAmount(goal.targetAmount)
    setIcon(goal.icon ?? null)
  }, [goal.id, goal.name, goal.targetDate, goal.targetAmount, goal.icon])

  useEffect(() => {
    setEmojiPickerIsOpen(false)
  }, [goal.id])

  const addIconOnClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    setEmojiPickerIsOpen((isOpen) => !isOpen)
  }

  const pickEmojiOnClick = (emoji: BaseEmoji, event: React.MouseEvent) => {
    event.stopPropagation()
    setIcon(emoji.native)
    setEmojiPickerIsOpen(false)

    const updatedGoal: Goal = {
      ...goal,
      icon: emoji.native,
      name: name ?? goal.name,
      targetDate: targetDate ?? goal.targetDate,
      targetAmount: targetAmount ?? goal.targetAmount,
    }
    dispatch(updateGoalRedux(updatedGoal))

    updateGoalApi(goal.id, updatedGoal)
  }

  const updateNameOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextName = event.target.value
    setName(nextName)
    const updatedGoal: Goal = {
      ...goal,
      name: nextName,
    }
    dispatch(updateGoalRedux(updatedGoal))
    updateGoalApi(goal.id, updatedGoal)
  }

  const updateTargetAmountOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextTargetAmount = parseFloat(event.target.value)
    setTargetAmount(nextTargetAmount)
    const updatedGoal: Goal = {
      ...goal,
      name: name ?? goal.name,
      targetDate: targetDate ?? goal.targetDate,
      targetAmount: nextTargetAmount,
    }
    dispatch(updateGoalRedux(updatedGoal))
    updateGoalApi(goal.id, updatedGoal)
  }

  const pickDateOnChange = (date: MaterialUiPickersDate) => {
    if (date != null) {
      setTargetDate(date)
      const updatedGoal: Goal = {
        ...goal,
        name: name ?? goal.name,
        targetDate: date,
        targetAmount: targetAmount ?? goal.targetAmount,
      }
      dispatch(updateGoalRedux(updatedGoal))
      updateGoalApi(goal.id, updatedGoal)
    }
  }

  return (
    <GoalManagerContainer onClick={() => setEmojiPickerIsOpen(false)}>
      <AddIconButton hasIcon={hasIcon} onClick={addIconOnClick} />

      {hasIcon && <GoalIcon icon={icon} onClick={addIconOnClick} />}

      {emojiPickerIsOpen && (
        <EmojiPickerContainer $hasIcon={hasIcon} onClick={(event) => event.stopPropagation()}>
          <EmojiPicker onClick={pickEmojiOnClick} />
        </EmojiPickerContainer>
      )}

      <NameInput value={name ?? ''} onChange={updateNameOnChange} />

      <Group>
        <Field name="Target Date" icon={faCalendarAlt} />
        <Value>
          <DatePicker value={targetDate} onChange={pickDateOnChange} />
        </Value>
      </Group>

      <Group>
        <Field name="Target Amount" icon={faDollarSign} />
        <Value>
          <StringInput value={targetAmount ?? ''} onChange={updateTargetAmountOnChange} />
        </Value>
      </Group>

      <Group>
        <Field name="Balance" icon={faDollarSign} />
        <Value>
          <StringValue>{goal.balance}</StringValue>
        </Value>
      </Group>

      <Group>
        <Field name="Date Created" icon={faCalendarAlt} />
        <Value>
          <StringValue>{new Date(goal.created).toLocaleDateString()}</StringValue>
        </Value>
      </Group>
    </GoalManagerContainer>
  )
}

type FieldProps = { name: string; icon: IconDefinition }
type EmojiPickerContainerProps = { $hasIcon: boolean }

const EmojiPickerContainer = styled.div<EmojiPickerContainerProps>`
  position: absolute;
  top: ${(props) => (props.$hasIcon ? '10rem' : '2rem')};
  left: 0;
  z-index: 1;
`

const Field = (props: FieldProps) => (
  <FieldContainer>
    <FontAwesomeIcon icon={props.icon} size="2x" />
    <FieldName>{props.name}</FieldName>
  </FieldContainer>
)

const GoalManagerContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  height: 100%;
  width: 100%;
  position: relative;
`

const Group = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  margin-top: 1.25rem;
  margin-bottom: 1.25rem;
`
const NameInput = styled.input`
  display: flex;
  background-color: transparent;
  outline: none;
  border: none;
  font-size: 4rem;
  font-weight: bold;
  color: ${({ theme }: { theme: Theme }) => theme.text};
`

const FieldName = styled.h1`
  font-size: 1.8rem;
  margin-left: 1rem;
  color: rgba(174, 174, 174, 1);
  font-weight: normal;
`
const FieldContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 20rem;

  svg {
    color: rgba(174, 174, 174, 1);
  }
`
const StringValue = styled.h1`
  font-size: 1.8rem;
  font-weight: bold;
`
const StringInput = styled.input`
  display: flex;
  background-color: transparent;
  outline: none;
  border: none;
  font-size: 1.8rem;
  font-weight: bold;
  color: ${({ theme }: { theme: Theme }) => theme.text};
`

const Value = styled.div`
  margin-left: 2rem;
`
