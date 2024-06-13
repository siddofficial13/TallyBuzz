import {NavigationContainerRef, CommonActions} from '@react-navigation/native';

let _navigator: NavigationContainerRef<any> | null = null;

function setTopLevelNavigator(
  navigatorRef: NavigationContainerRef<any> | null,
) {
  _navigator = navigatorRef;
}

function navigate(routeName: string, params?: object) {
  if (_navigator && _navigator.isReady()) {
    _navigator.navigate(routeName, params);
  } else {
    console.warn(
      'Navigation container is not ready or navigator reference is null.',
    );
  }
}

function goBack() {
  if (_navigator && _navigator.isReady()) {
    _navigator.dispatch(CommonActions.goBack());
  } else {
    console.warn(
      'Navigation container is not ready or navigator reference is null.',
    );
  }
}

export default {
  navigate,
  setTopLevelNavigator,
  goBack,
};