import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { BannerLinkType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateTopProductsWidgetDto } from './dto/update-top-products-widget.dto';

const TOP_PRODUCTS_KEY = 'top-products';

type HomeWidgetRow = {
  id: string;
  key: string;
  title: string;
  linkType: BannerLinkType;
  linkId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type TopProductsWidgetView = {
  id: string | null;
  key: string;
  title: string;
  linkType: BannerLinkType;
  linkId: string | null;
  isActive: boolean;
};

@Injectable()
export class HomeWidgetsService {
  constructor(private readonly prisma: PrismaService) {}

  private getDefaultTopProductsWidget(): TopProductsWidgetView {
    return {
      id: null,
      key: TOP_PRODUCTS_KEY,
      title: 'Top Products',
      linkType: BannerLinkType.NONE,
      linkId: null,
      isActive: true,
    };
  }

  async getTopProductsWidget() {
    const rows = await this.prisma.$queryRaw<HomeWidgetRow[]>`
      SELECT
        id,
        key,
        title,
        link_type AS "linkType",
        link_id AS "linkId",
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        deleted_at AS "deletedAt"
      FROM home_widgets
      WHERE key = ${TOP_PRODUCTS_KEY}
        AND deleted_at IS NULL
      ORDER BY updated_at DESC
      LIMIT 1
    `;

    return { data: (rows[0] as TopProductsWidgetView | undefined) ?? this.getDefaultTopProductsWidget() };
  }

  async updateTopProductsWidget(dto: UpdateTopProductsWidgetDto) {
    const current = (await this.getTopProductsWidget()).data;
    const nextTitle = dto.title?.trim() || current.title || 'Top Products';
    const nextLinkType = dto.linkType ?? current.linkType ?? BannerLinkType.NONE;
    const nextLinkId = nextLinkType === BannerLinkType.NONE ? null : dto.linkId?.trim() || current.linkId || null;
    const nextIsActive = dto.isActive ?? current.isActive ?? true;
    const nextId = current.id ?? randomUUID();

    const rows = await this.prisma.$queryRaw<HomeWidgetRow[]>`
      INSERT INTO home_widgets (id, key, title, link_type, link_id, is_active, created_at, updated_at)
      VALUES (${nextId}, ${TOP_PRODUCTS_KEY}, ${nextTitle}, ${nextLinkType}::"BannerLinkType", ${nextLinkId}, ${nextIsActive}, NOW(), NOW())
      ON CONFLICT (key)
      DO UPDATE SET
        title = EXCLUDED.title,
        link_type = EXCLUDED.link_type,
        link_id = EXCLUDED.link_id,
        is_active = EXCLUDED.is_active,
        deleted_at = NULL,
        updated_at = NOW()
      RETURNING
        id,
        key,
        title,
        link_type AS "linkType",
        link_id AS "linkId",
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        deleted_at AS "deletedAt"
    `;

    return { message: 'Top products widget updated successfully', data: rows[0] };
  }
}