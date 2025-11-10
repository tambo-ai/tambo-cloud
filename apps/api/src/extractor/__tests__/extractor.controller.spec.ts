import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ApiKeyGuard } from "../../projects/guards/apikey.guard";
import { StorageService } from "../../common/services/storage.service";
import { ExtractorController } from "../extractor.controller";

describe("ExtractorController", () => {
  let controller: ExtractorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExtractorController],
      providers: [
        {
          provide: "AIService",
          useValue: {
            extractComponentDefinitions: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            upload: jest.fn().mockResolvedValue("storage://test/path"),
          },
        },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ExtractorController>(ExtractorController);
  });

  describe("extractPdfText", () => {
    const mockRequest = {
      headers: {},
    } as any;

    it("should throw BadRequestException when file is too large", async () => {
      const largeFile = {
        buffer: Buffer.from("test"),
        size: 51 * 1024 * 1024, // 51MB
        mimetype: "application/pdf",
        originalname: "test.pdf",
      } as Express.Multer.File;

      await expect(
        controller.extractPdfText(mockRequest, largeFile),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException for non-PDF files", async () => {
      const nonPdfFile = {
        buffer: Buffer.from("test"),
        size: 1024,
        mimetype: "image/png",
        originalname: "test.png",
      } as Express.Multer.File;

      await expect(
        controller.extractPdfText(mockRequest, nonPdfFile),
      ).rejects.toThrow(BadRequestException);
    });

    it("should accept valid PDF file size and type", () => {
      const validFile = {
        buffer: Buffer.from("test"),
        size: 1024, // 1KB - valid size
        mimetype: "application/pdf",
        originalname: "test.pdf",
      } as Express.Multer.File;

      // Validation should not throw
      expect(() => {
        (controller as any).validateFile(validFile);
      }).not.toThrow();
    });
  });
});
