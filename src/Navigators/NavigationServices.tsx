import { NavigationContainerRef, CommonActions } from '@react-navigation/native';

let _navigator: NavigationContainerRef<any> | null = null;

function setTopLevelNavigator(
    navigatorRef: NavigationContainerRef<any> | null,
) {
    _navigator = navigatorRef;
}

function navigate(name: string, params?: Record<string, any>) {
    if (_navigator && _navigator.isReady()) {
        _navigator.dispatch(
            CommonActions.navigate({
                name,
                params,
            }),
        );
    } else {
        console.warn(
            'Navigation container is not ready or navigator reference is null.',
        );
    }
}

function reset(name: string, params?: Record<string, any>) {
    if (_navigator && _navigator.isReady()) {
        _navigator.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name, params }],
            }),
        );
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
    reset,
    goBack,
    setTopLevelNavigator,
};
