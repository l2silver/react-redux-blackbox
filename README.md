React Redux Blackbox
=========================

Unofficial React bindings for [Redux](https://github.com/reactjs/redux).  
A more functional approach, but not to be used without a thorough understanding of the official bindings, [react-redux](https://github.com/reactjs/react-redux).

[![Build Status](https://travis-ci.org/l2silver/react-redux-blackbox.svg?branch=master)](https://travis-ci.org/l2silver/react-redux-blackbox)

## Additional Resources
[Functionally sexier unofficial react redux bindings: The Medium Article](https://medium.com/p/a94141ed00c7)  
[TJs frontend-boilerplate with blackbox](https://github.com/l2silver/frontend-boilerplate-blackbox)

## Installation

React Redux requires **React 0.14 or later.**

```
npm install --save react-redux-blackbox
```

## The secret sauce

Providers are the only component connected to the store. All connect mapStateToProps functions are sent to the Provider, and the resulting props are passed down through a blackbox object.

## New connect implimentation

```
import { filterConnect } from 'react-redux-blackbox'

const Wrapped = filterConnect(
	(state, props)=>{...},
	(dispatch, props)=>{...},
	(stateProps, dispatchProps, ownProps)=>{...},
	options
)(Container)

or

const Wrapped = filterConnect(
	[(state, resultProps)=>{...}, props=>resultProps],
	[(dispatch, resultProps)=>{...}, props=>resultProps],
	(stateProps, dispatchProps, ownProps)=>{...}, 
	options
)(Container)
```

I've added the extra props change check because with blackbox, mapStateToProps functions that rely on props will do a double calculation everytime the resultProps change. This way we avoid double calculations when the resultProps are shallow equal.

```
import { Provider } from 'react-redux-blackbox'

function ProviderContent(props){
	<Wrapped blackbox={props.blackbox} />
}

<Provider store={store}>
	<ProviderContent />
</Provider>
```

Provider passes its only child the blackbox object through props, and from their you pass the blackbox to all the filterConnect components