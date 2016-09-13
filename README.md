React Redux Blackbox
=========================

Unofficial React bindings for [Redux](https://github.com/reactjs/redux).  
A more functional approach, but not to be used without a thorough understanding of the official bindings, react-redux

[![build status](https://img.shields.io/travis/reactjs/react-redux/master.svg?style=flat-square)](https://travis-ci.org/reactjs/react-redux)


## Installation

React Redux requires **React 0.14 or later.**

```
npm install --save react-redux-blackbox
```

## The secret sauce

Providers are the only component connected to the store. All connect mapStateToProps functions are sent to the Provider, and the resulting props are passed down through a blackbox object.

## New connect implimentation

```
import filterConnect from 'react-redux-blackbox'

filterConnect(
	(state, props)=>{...},
	(dispatch, props)=>{...},
	(stateProps, dispatchProps, ownProps)=>{...},
	options
)(Container)

or

filterConnect(
	[(state, resultProps)=>{...}, props=>resultProps],
	[(dispatch, resultProps)=>{...}, props=>resultProps],
	(stateProps, dispatchProps, ownProps)=>{...}, 
	options
)
```

I've added the extra props change check because with blackbox, mapStateToProps functions that rely on props will do a double calculation everytime the resultProps change. This way we avoid double calculations when the resultProps are shallow equal.