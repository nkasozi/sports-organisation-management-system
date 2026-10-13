import { afterEach, describe, expect, it, vi } from "vitest";

import { convert_file_to_base64 } from "./dynamicFormFileEncoding";
import { DYNAMIC_FORM_MESSAGE } from "./dynamicFormMessages";

type ReaderOutcome = { result: unknown; should_fail: boolean };

function stub_file_reader(outcome: ReaderOutcome): void {
  class FakeFileReader {
    result: unknown = void 0;
    error: unknown = void 0;
    onload: () => boolean = () => true;
    onerror: () => boolean = () => true;
    readAsDataURL(): void {
      if (outcome.should_fail) {
        this.error = "read failed";
        this.onerror();
        return;
      }
      this.result = outcome.result;
      this.onload();
    }
  }
  vi.stubGlobal("FileReader", FakeFileReader);
}

const sample_file = { size: 10 } as File;

describe("convert_file_to_base64", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the encoded data url on success", async () => {
    stub_file_reader({
      result: "data:image/png;base64,AAA",
      should_fail: false,
    });
    await expect(convert_file_to_base64(sample_file)).resolves.toEqual({
      success: true,
      data: "data:image/png;base64,AAA",
    });
  });

  it("returns a friendly failure and logs when the read fails", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    stub_file_reader({ result: void 0, should_fail: true });
    await expect(convert_file_to_base64(sample_file)).resolves.toEqual({
      success: false,
      error: DYNAMIC_FORM_MESSAGE.FILE_PROCESSING_FAILED,
    });
    expect(error_spy).toHaveBeenCalled();
  });

  it("returns a friendly failure when the reader yields no text", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    stub_file_reader({ result: new ArrayBuffer(1), should_fail: false });
    await expect(convert_file_to_base64(sample_file)).resolves.toEqual({
      success: false,
      error: DYNAMIC_FORM_MESSAGE.FILE_PROCESSING_FAILED,
    });
  });
});
