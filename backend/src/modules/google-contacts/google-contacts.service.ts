import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, people_v1 } from 'googleapis';
import { PrismaService } from '../../prisma/prisma.service';

export type GoogleContactInput = {
  userId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  city?: string | null;
};

@Injectable()
export class GoogleContactsService {
  private readonly logger = new Logger(GoogleContactsService.name);
  private peopleClient: people_v1.People | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  isConfigured(): boolean {
    const enabled = this.configService.get<boolean>('googleContacts.enabled');
    const clientId = this.configService.get<string>('googleContacts.clientId');
    const clientSecret = this.configService.get<string>(
      'googleContacts.clientSecret',
    );
    const refreshToken = this.configService.get<string>(
      'googleContacts.refreshToken',
    );

    return Boolean(enabled && clientId && clientSecret && refreshToken);
  }

  /**
   * Create a Google Contact for a registered user and persist the resource name.
   * Failures are logged only — signup must not fail because of Contacts sync.
   */
  async syncUserContact(input: GoogleContactInput): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.debug(
        'Google Contacts sync skipped (not enabled or missing credentials)',
      );
      return;
    }

    try {
      const existing = await this.prisma.user.findUnique({
        where: { id: input.userId },
        select: { googleContactResourceName: true },
      });

      if (existing?.googleContactResourceName) {
        this.logger.debug(
          `Google Contact already linked for user ${input.userId}; skip create`,
        );
        return;
      }

      const people = this.getPeopleClient();
      const contact: people_v1.Schema$Person = {
        names: [{ givenName: input.name }],
        emailAddresses: input.email
          ? [{ value: input.email, type: 'work' }]
          : undefined,
        phoneNumbers: input.phone
          ? [{ value: input.phone, type: 'mobile' }]
          : undefined,
        organizations: input.companyName
          ? [{ name: input.companyName, type: 'work' }]
          : undefined,
        addresses: input.city
          ? [{ city: input.city, type: 'work' }]
          : undefined,
      };

      const response = await people.people.createContact({
        requestBody: contact,
      });

      const resourceName = response.data.resourceName;
      if (!resourceName) {
        this.logger.warn(
          `Google Contacts create returned no resourceName for user ${input.userId}`,
        );
        return;
      }

      await this.prisma.user.update({
        where: { id: input.userId },
        data: { googleContactResourceName: resourceName },
      });

      this.logger.log(
        `Synced Google Contact ${resourceName} for user ${input.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to sync Google Contact for user ${input.userId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Delete the Google Contact linked to a user (if any).
   * Failures are logged only — soft-delete must not fail because of Contacts sync.
   */
  async deleteUserContact(
    userId: string,
    resourceName?: string | null,
  ): Promise<void> {
    if (!this.isConfigured()) {
      return;
    }

    let contactResourceName = resourceName;
    if (!contactResourceName) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { googleContactResourceName: true },
      });
      contactResourceName = user?.googleContactResourceName;
    }

    if (!contactResourceName) {
      this.logger.debug(
        `No Google Contact linked for user ${userId}; skip delete`,
      );
      return;
    }

    try {
      const people = this.getPeopleClient();
      await people.people.deleteContact({
        resourceName: contactResourceName,
      });

      await this.prisma.user.update({
        where: { id: userId },
        data: { googleContactResourceName: null },
      });

      this.logger.log(
        `Deleted Google Contact ${contactResourceName} for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete Google Contact for user ${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private getPeopleClient(): people_v1.People {
    if (this.peopleClient) {
      return this.peopleClient;
    }

    const clientId = this.configService.get<string>('googleContacts.clientId');
    const clientSecret = this.configService.get<string>(
      'googleContacts.clientSecret',
    );
    const refreshToken = this.configService.get<string>(
      'googleContacts.refreshToken',
    );

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    this.peopleClient = google.people({ version: 'v1', auth: oauth2Client });
    return this.peopleClient;
  }
}
