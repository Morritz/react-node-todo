import React from 'react'
import Enzyme from 'enzyme';
import App from './App';
import Adapter from 'enzyme-adapter-react-16';
import { shallow } from 'enzyme';

Enzyme.configure({ adapter: new Adapter() })

describe('App', () => {
    it('should render 3 <div /> ( div - username , div - password, div - App container', () => {
        const wrapper = shallow(<App />);
        expect(wrapper.find('div').length).toEqual(3);

    });
});

describe('Buttons', () => {
    it('should render 4 buttons (login, register, delete, refresh', () => {
        const wrapper = shallow(<App />);
        expect(wrapper.find('button').length).toEqual(4);

    });
});