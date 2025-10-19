import * as utils from '../src/utils/navigate';

describe('utils/navigate', () => {
  it('calls window.location.assign with url via indirection', () => {
    const spy = jest.spyOn(utils, 'locationAssign').mockImplementation(() => {});
    utils.navigateTo('/home');
    expect(spy).toHaveBeenCalledWith('/home');
    spy.mockRestore();
  });
});


