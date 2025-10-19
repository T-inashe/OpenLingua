import { handleUnauthorized, NavigateFunction, ProAlert } from '../../src/utils/handleUnauthorized';

describe("handleUnauthorized", () => {
  let mockNavigate: NavigateFunction;
  let mockProAlert: ProAlert;

  beforeEach(() => {
    mockNavigate = jest.fn();
    mockProAlert = { show: jest.fn(), info: jest.fn() };
  });

  test("calls navigate and proAlert.info on 401", () => {
    const response = { status: 401 } as Response;
    const result = handleUnauthorized(response, mockNavigate, mockProAlert);

    expect(result).toBe(true);
    expect(mockProAlert.info).toHaveBeenCalledWith(
      "Your session has expired. Please sign in again."
    );
    expect(mockNavigate).toHaveBeenCalledWith("/signIn", { replace: true });
  });

  test("calls navigate even if proAlert is undefined", () => {
    const response = { status: 401 } as Response;
    const result = handleUnauthorized(response, mockNavigate);

    expect(result).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith("/signIn", { replace: true });
  });

  test("does nothing on non-401 status", () => {
    const response = { status: 403 } as Response;
    const result = handleUnauthorized(response, mockNavigate, mockProAlert);

    expect(result).toBe(false);
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockProAlert.info).not.toHaveBeenCalled();
  });
});

