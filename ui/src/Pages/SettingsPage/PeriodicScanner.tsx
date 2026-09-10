import { gql } from '@apollo/client'
import React, { useRef, useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { InputLabelDescription, InputLabelTitle } from './SettingsPage'
import { useTranslation } from 'react-i18next'
import { scanIntervalQuery } from './__generated__/scanIntervalQuery'
import {
  changeScanIntervalMutation,
  changeScanIntervalMutationVariables,
} from './__generated__/changeScanIntervalMutation'
import Checkbox from '../../primitives/form/Checkbox'
import { TextField } from '../../primitives/form/Input'
import Dropdown, { DropdownItem } from '../../primitives/form/Dropdown'
import Loader from '../../primitives/Loader'

export const SCAN_INTERVAL_QUERY = gql`
  query scanIntervalQuery {
    siteInfo {
      periodicScanInterval
    }
  }
`

export const SCAN_INTERVAL_MUTATION = gql`
  mutation changeScanIntervalMutation($interval: Int!) {
    setPeriodicScanInterval(interval: $interval)
  }
`

enum TimeUnit {
  Second = 'second',
  Minute = 'minute',
  Hour = 'hour',
  Day = 'day',
  Month = 'month',
}

const timeUnits = [
  {
    value: TimeUnit.Second,
    multiplier: 1,
  },
  {
    value: TimeUnit.Minute,
    multiplier: 60,
  },
  {
    value: TimeUnit.Hour,
    multiplier: 60 * 60,
  },
  {
    value: TimeUnit.Day,
    multiplier: 60 * 60 * 24,
  },
  {
    value: TimeUnit.Month,
    multiplier: 60 * 60 * 24 * 30,
  },
]

type TimeValue = {
  value: number
  unit: TimeUnit
}

const convertToSeconds = ({ value, unit }: TimeValue) => {
  return value * (timeUnits.find(x => x.value == unit)?.multiplier as number)
}

const convertToAppropriateUnit = ({ value, unit }: TimeValue): TimeValue => {
  if (value == 0) {
    return {
      unit: TimeUnit.Second,
      value: 0,
    }
  }

  const seconds = convertToSeconds({ value, unit })

  let resultingUnit = timeUnits[0]
  for (const unit of timeUnits) {
    if (
      seconds / unit.multiplier >= 1 &&
      (seconds / unit.multiplier) % 1 == 0
    ) {
      resultingUnit = unit
    } else {
      break
    }
  }

  return {
    unit: resultingUnit.value,
    value: seconds / resultingUnit.multiplier,
  }
}

const PeriodicScanner = () => {
  const { t } = useTranslation()

  const [enablePeriodicScanner, setEnablePeriodicScanner] = useState(false)
  const [scanInterval, setScanInterval] = useState<TimeValue>({
    value: 2,
    unit: TimeUnit.Hour,
  })

  const scanIntervalServerValue = useRef<number | null>(null)

  const scanIntervalQuery = useQuery<scanIntervalQuery>(SCAN_INTERVAL_QUERY, {
    fetchPolicy: 'network-only',
    onCompleted(data) {
      const queryScanInterval = data.siteInfo.periodicScanInterval
      scanIntervalServerValue.current = queryScanInterval

      if (queryScanInterval == 0) {
        setScanInterval(prev => ({
          unit: prev.value > 0 ? prev.unit : TimeUnit.Hour,
          value: prev.value > 0 ? prev.value : 2,
        }))
      } else {
        setScanInterval(
          convertToAppropriateUnit({
            unit: TimeUnit.Second,
            value: queryScanInterval,
          })
        )
      }

      setEnablePeriodicScanner(queryScanInterval > 0)
    },
  })

  const [setScanIntervalMutation, { loading: scanIntervalMutationLoading }] =
    useMutation<
      changeScanIntervalMutation,
      changeScanIntervalMutationVariables
    >(SCAN_INTERVAL_MUTATION, {
      refetchQueries: [{ query: SCAN_INTERVAL_QUERY }],
    })

  const onScanIntervalCheckboxChange = (checked: boolean) => {
    setEnablePeriodicScanner(checked)

    if (checked) {
      const intervalToSave =
        scanInterval.value > 0
          ? scanInterval
          : { value: 2, unit: TimeUnit.Hour }
      setScanInterval(intervalToSave)
      onScanIntervalUpdate(intervalToSave)
    } else {
      onScanIntervalUpdate({ value: 0, unit: TimeUnit.Second })
    }
  }

  const onScanIntervalUpdate = (targetInterval: TimeValue) => {
    const seconds = convertToSeconds(targetInterval)

    if (scanIntervalServerValue.current !== seconds) {
      scanIntervalServerValue.current = seconds
      setScanIntervalMutation({
        variables: {
          interval: seconds,
        },
      })
    }
  }

  const scanIntervalUnits: DropdownItem[] = [
    {
      label: t('settings.periodic_scanner.interval_unit.seconds', 'Seconds'),
      value: TimeUnit.Second,
    },
    {
      label: t('settings.periodic_scanner.interval_unit.minutes', 'Minutes'),
      value: TimeUnit.Minute,
    },
    {
      label: t('settings.periodic_scanner.interval_unit.hour', 'Hour'),
      value: TimeUnit.Hour,
    },
    {
      label: t('settings.periodic_scanner.interval_unit.days', 'Days'),
      value: TimeUnit.Day,
    },
    {
      label: t('settings.periodic_scanner.interval_unit.months', 'Months'),
      value: TimeUnit.Month,
    },
  ]

  return (
    <>
      <h3 className="font-semibold text-lg mt-4 mb-2">
        {t('settings.periodic_scanner.title', 'Periodic scanner')}
      </h3>

      <Checkbox
        label={t(
          'settings.periodic_scanner.checkbox_label',
          'Enable periodic scanner'
        )}
        disabled={scanIntervalQuery.loading}
        checked={enablePeriodicScanner}
        onChange={event =>
          onScanIntervalCheckboxChange(event.target.checked || false)
        }
      />

      <div className="mt-4">
        <label htmlFor="periodic_scan_field">
          <InputLabelTitle>
            {t(
              'settings.periodic_scanner.field.label',
              'Periodic scan interval'
            )}
          </InputLabelTitle>
          <InputLabelDescription>
            {t(
              'settings.periodic_scanner.field.description',
              'How often the scanner should perform automatic scans of all users'
            )}
          </InputLabelDescription>
        </label>
        <div className="flex gap-2">
          <TextField
            id="periodic_scan_field"
            aria-label="Interval value"
            disabled={!enablePeriodicScanner}
            value={scanInterval.value}
            onChange={e => {
              const val = Number(e.target.value)
              setScanInterval(x => ({
                value: isNaN(val) ? 0 : val,
                unit: x.unit,
              }))
            }}
            onBlur={() => {
              if (enablePeriodicScanner && scanInterval.value > 0) {
                onScanIntervalUpdate(scanInterval)
              }
            }}
            action={() => {
              if (enablePeriodicScanner && scanInterval.value > 0) {
                onScanIntervalUpdate(scanInterval)
              }
            }}
          />
          <Dropdown
            aria-label="Interval unit"
            disabled={!enablePeriodicScanner}
            items={scanIntervalUnits}
            selected={scanInterval.unit}
            setSelected={value => {
              const newScanInterval: TimeValue = {
                ...scanInterval,
                unit: value as TimeUnit,
              }

              setScanInterval(newScanInterval)
              if (enablePeriodicScanner && newScanInterval.value > 0) {
                onScanIntervalUpdate(newScanInterval)
              }
            }}
          />
        </div>
      </div>
      <Loader
        active={scanIntervalQuery.loading || scanIntervalMutationLoading}
        size="small"
        style={{ marginLeft: 16 }}
      />
    </>
  )
}

export default PeriodicScanner
