import React, { useState, useEffect, Fragment } from 'react';
import { StyleSheet, View, StatusBar, Platform, Dimensions } from 'react-native'
import { Provider as PaperProvider } from 'react-native-paper'

import CurrenciesTop from './src/screens/currencies/CurrenciesTop'
import CurrenciesContainer from './src/screens/currencies/content/CurrenciesContainer'
import CurrenciesBottom from './src/screens/currencies/CurrenciesBottom'
import FavoritesTop from './src/screens/favorites/FavoritesTop'
import FavoritesContainer from './src/screens/favorites/content/FavoritesContainer'
import { currencies } from './src/constants/currencies'
import { darkTheme } from './src/constants/colors'
import { lightTheme } from './src/constants/colors'
import {
  AsyncStorageServices, getMatchedCurrencies, fetchExchangeRate,
  getUpdatedCurrencies, updateIsFavorite, updateRateInfo, getFromCurrency
} from './src/utils/helper'

const { getTheme, getDeviceCurrencies, getFromCurrencyFlag } = AsyncStorageServices
const windowHeigh = Dimensions.get('window').height
const defaultTheme = darkTheme
const defaultCurrencies = currencies.map(curr => ({ ...curr, isFavorite: false }))

export default function App() {
  const [mainVisible, setMainVisible] = useState(true)
  const [fromCurrencyFlag, setFromCurrencyFlag] = useState('usd')
  const [amount, setAmount] = useState('')
  const [deviceCurrencies, setDeviceCurrencies] = useState(defaultCurrencies)
  const [filteredCurrencies, setFilteredCurrencies] = useState([])
  const [appTheme, setAppTheme] = useState(defaultTheme)

  useEffect(() => {
    getTheme().then(setAppTheme).catch(setAppTheme(defaultTheme))
    getDeviceCurrencies().then(setDeviceCurrencies).catch(setDeviceCurrencies(defaultCurrencies))
    getFromCurrencyFlag().then(setFromCurrencyFlag).catch(setFromCurrencyFlag('usd'))
  }, [])

  const styles = getStyle(appTheme)

  const searchCurrency = term => {
    const resultCurrencies = getMatchedCurrencies(term, deviceCurrencies)
    setFilteredCurrencies(resultCurrencies)
  }

  const updateTheme = async () => {
    const theme = (appTheme.name === 'darkTheme') ? lightTheme : darkTheme
    setAppTheme(theme)
    AsyncStorageServices.saveTheme(theme)
  }

  const updateRates = async () => {
    // const BRL = await fetchExchangeRate('BRL')
    // console.log({ BRL })
    const rateInfo = await fetchExchangeRate(fromCurrencyFlag)
    const updatedCurrency = updateRateInfo(fromCurrencyFlag, rateInfo, deviceCurrencies)
    const updatedCurrencies = getUpdatedCurrencies(updatedCurrency, deviceCurrencies)
    setDeviceCurrencies(updatedCurrencies)
    AsyncStorageServices.saveCurrencies(updatedCurrencies)
  }

  const updateCurrency = async (name) => {
    const updatedCurrency = updateIsFavorite(name, deviceCurrencies)
    const updatedCurrencies = getUpdatedCurrencies(updatedCurrency, deviceCurrencies)
    setDeviceCurrencies(updatedCurrencies)
    AsyncStorageServices.saveCurrencies(updatedCurrencies)
  }

  const fromCurrency = getFromCurrency(fromCurrencyFlag, deviceCurrencies)

  const MainScreen = (
    <Fragment>
      <CurrenciesTop
        appTheme={appTheme}
        fromCurrency={fromCurrency}
        setFromCurrencyFlag={setFromCurrencyFlag}
        allCurrencies={deviceCurrencies}
        amount={amount}
        setAmount={setAmount}
        updateRates={updateRates}
      />
      <CurrenciesContainer
        appTheme={appTheme}
        fromCurrency={fromCurrency}
        amount={amount}
        changeScreen={setMainVisible}
        allCurrencies={deviceCurrencies}
      />
      <CurrenciesBottom
        appTheme={appTheme}
        updateTheme={updateTheme}
        updateRates={updateRates}
        lastRates={fromCurrency.rateInfo}
      />
    </Fragment>
  )

  const FavoritesScreen = (
    <Fragment>
      <FavoritesTop
        appTheme={appTheme}
        changeScreen={setMainVisible}
        searchCurrency={searchCurrency}
        allCurrencies={deviceCurrencies}
      />
      <FavoritesContainer
        appTheme={appTheme}
        allCurrencies={filteredCurrencies}
        updateCurrency={updateCurrency}
      />
    </Fragment>
  )

  return (
    <PaperProvider>
      <View style={{ minHeight: windowHeigh, flexGrow: 1, flexDirection: 'column' }}>
        {Platform.OS === 'ios' && <StatusBar barStyle="default" />}
        {Platform.OS === 'android' && <View style={styles.statusBarUnderlay} />}

        {(mainVisible) ? MainScreen : FavoritesScreen}
      </View>
    </PaperProvider>
  );
}

const getStyle = theme => (
  StyleSheet.create({
    statusBarUnderlay: {
      height: 28,
      backgroundColor: theme.primary,
    }
  })
)